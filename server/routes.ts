import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticateToken, generateToken, type AuthRequest } from "./middleware/auth";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors());
  app.use(limiter);

  const httpServer = createServer(app);
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req: any) => {
    let userId: string | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate') {
          if (data.token && data.userId) {
            try {
              const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
              const decoded = jwt.verify(data.token, JWT_SECRET) as { userId: string };
              if (decoded.userId === data.userId) {
                userId = data.userId;
                if (userId) {
                  connectedClients.set(userId, ws);
                  await storage.updateUserOnlineStatus(userId, true);
                  broadcast({ type: 'user_online', userId });
                }
              }
            } catch (error) {
              console.error('WebSocket auth error:', error);
            }
          }
        } else if (data.type === 'message' && userId) {
          const newMessage = await storage.createMessage({
            content: data.content,
            senderId: userId,
            receiverId: data.receiverId || null,
            groupId: data.groupId || null,
            mediaUrl: data.mediaUrl || null,
            mediaType: data.mediaType || null,
          });

          const sender = await storage.getUser(userId);
          const messageWithSender = { ...newMessage, sender };

          if (data.receiverId) {
            const receiverWs = connectedClients.get(data.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({
                type: 'new_message',
                message: messageWithSender,
              }));
            }
          } else if (data.groupId) {
            const members = await storage.getGroupMembers(data.groupId);
            members.forEach(member => {
              if (member.userId !== userId) {
                const memberWs = connectedClients.get(member.userId);
                if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                  memberWs.send(JSON.stringify({
                    type: 'new_message',
                    message: messageWithSender,
                  }));
                }
              }
            });
          }

          ws.send(JSON.stringify({
            type: 'message_sent',
            message: messageWithSender,
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (userId) {
        connectedClients.delete(userId);
        await storage.updateUserOnlineStatus(userId, false);
        broadcast({ type: 'user_offline', userId });
      }
    });
  });

  function broadcast(data: any) {
    const message = JSON.stringify(data);
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  app.post('/api/auth/signup', [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty().escape(),
  ], async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { username, email, phone, password, name, bio, profilePicture } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        email,
        phone: phone || null,
        password: hashedPassword,
        name,
        bio: bio || null,
        profilePicture: profilePicture || null,
      });

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  app.post('/api/auth/login', [
    body('emailOrPhone').trim().notEmpty(),
    body('password').notEmpty(),
  ], async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    try {
      const { emailOrPhone, password } = req.body;
      const user = await storage.getUserByEmailOrPhone(emailOrPhone);

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/users', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/online', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const onlineStatus: Record<string, boolean> = {};
      users.forEach(user => {
        onlineStatus[user.id] = user.isOnline || false;
      });
      res.json(onlineStatus);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch online status' });
    }
  });

  app.patch('/api/users/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, bio, profilePicture } = req.body;
      const updated = await storage.updateUserProfile(req.userId!, { name, bio, profilePicture });
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.get('/api/users/search/:query', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const results = await storage.searchUsers(req.params.query, req.userId!);
      const withoutPasswords = results.map(({ password, ...user }) => user);
      res.json(withoutPasswords);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  app.post('/api/friend-requests', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { receiverId } = req.body;
      await storage.sendFriendRequest(req.userId!, receiverId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send friend request' });
    }
  });

  app.get('/api/friend-requests/pending', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requests = await storage.getPendingRequests(req.userId!);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  app.patch('/api/friend-requests/:requestId/accept', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.acceptFriendRequest(req.params.requestId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to accept request' });
    }
  });

  app.patch('/api/friend-requests/:requestId/reject', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.rejectFriendRequest(req.params.requestId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject request' });
    }
  });

  app.get('/api/messages/conversations', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const lastMessages = await storage.getLastMessages(req.userId!);
      const messagesWithSenders: Record<string, any> = {};
      
      for (const [userId, message] of Object.entries(lastMessages)) {
        const sender = await storage.getUser(message.senderId);
        messagesWithSenders[userId] = { ...message, sender };
      }
      
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.get('/api/messages/:userId', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const messages = await storage.getMessagesBetweenUsers(req.userId!, req.params.userId);
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return { ...message, sender };
        })
      );
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', authenticateToken, [
    body('content').trim().notEmpty(),
  ], async (req: AuthRequest, res: any) => {
    try {
      const { content, receiverId, groupId, mediaUrl, mediaType } = req.body;
      const message = await storage.createMessage({
        content,
        senderId: req.userId!,
        receiverId: receiverId || null,
        groupId: groupId || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
      });

      const sender = await storage.getUser(req.userId!);
      res.json({ ...message, sender });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/posts', authenticateToken, async (req: AuthRequest, res: any): Promise<void> => {
    try {
      const posts = await storage.getAllPosts();
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
          const { password, ...authorWithoutPassword } = author!;
          return { ...post, author: authorWithoutPassword };
        })
      );
      res.json(postsWithAuthors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.get('/api/posts/user/:userId', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const posts = await storage.getUserPosts(req.params.userId);
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
          const { password, ...authorWithoutPassword } = author!;
          return { ...post, author: authorWithoutPassword };
        })
      );
      res.json(postsWithAuthors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user posts' });
    }
  });

  app.get('/api/posts/likes', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const likes = await storage.getUserPostLikes(req.userId!);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch post likes' });
    }
  });

  app.post('/api/posts', authenticateToken, [
    body('content').optional(),
    body('mediaUrl').optional(),
  ], async (req: AuthRequest, res: any): Promise<void> => {
    try {
      const { content, mediaUrl, mediaType } = req.body;
      if (!content && !mediaUrl) {
        return res.status(400).json({ error: 'Post must have content or media' });
      }

      const post = await storage.createPost({
        content: content || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        authorId: req.userId!,
      });

      const author = await storage.getUser(req.userId!);
      const { password, ...authorWithoutPassword } = author!;
      res.json({ ...post, author: authorWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.post('/api/posts/:postId/like', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const isLiked = await storage.isPostLikedByUser(req.userId!, req.params.postId);
      if (isLiked) {
        await storage.unlikePost(req.userId!, req.params.postId);
      } else {
        await storage.likePost(req.userId!, req.params.postId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  });

  app.get('/api/posts/comments', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const allComments = await storage.getAllPostComments();
      const commentsWithAuthors: Record<string, any[]> = {};
      
      for (const [postId, comments] of Object.entries(allComments)) {
        commentsWithAuthors[postId] = await Promise.all(
          comments.map(async (comment) => {
            const author = await storage.getUser(comment.authorId);
            const { password, ...authorWithoutPassword } = author!;
            return { ...comment, author: authorWithoutPassword };
          })
        );
      }
      
      res.json(commentsWithAuthors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.post('/api/comments', authenticateToken, [
    body('content').trim().notEmpty(),
    body('postId').notEmpty(),
  ], async (req: AuthRequest, res) => {
    try {
      const { content, postId } = req.body;
      const comment = await storage.createComment({
        content,
        postId,
        authorId: req.userId!,
      });

      const author = await storage.getUser(req.userId!);
      const { password, ...authorWithoutPassword } = author!;
      res.json({ ...comment, author: authorWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  app.get('/api/groups', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const groups = await storage.getAllGroups();
      const groupsWithMembers = await Promise.all(
        groups.map(async (group) => {
          const members = await storage.getGroupMembers(group.id);
          const membersWithUsers = await Promise.all(
            members.map(async (member) => {
              const user = await storage.getUser(member.userId);
              const { password, ...userWithoutPassword } = user!;
              return { ...member, user: userWithoutPassword };
            })
          );
          return { ...group, members: membersWithUsers };
        })
      );
      res.json(groupsWithMembers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  app.get('/api/groups/my-memberships', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const memberships = await storage.getUserGroupMemberships(req.userId!);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch memberships' });
    }
  });

  app.post('/api/groups', authenticateToken, [
    body('name').trim().notEmpty(),
  ], async (req: AuthRequest, res) => {
    try {
      const { name, description, groupPicture } = req.body;
      const group = await storage.createGroup({
        name,
        description: description || null,
        groupPicture: groupPicture || null,
        creatorId: req.userId!,
      });
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create group' });
    }
  });

  app.post('/api/groups/:groupId/join', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.addGroupMember(req.params.groupId, req.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to join group' });
    }
  });

  app.post('/api/groups/:groupId/leave', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.removeGroupMember(req.params.groupId, req.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to leave group' });
    }
  });

  app.get('/api/groups/:groupId/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getGroupMessages(req.params.groupId);
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return { ...message, sender };
        })
      );
      res.json(messagesWithSenders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch group messages' });
    }
  });

  return httpServer;
}
