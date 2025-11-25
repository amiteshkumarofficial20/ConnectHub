import { 
  users, messages, posts, postLikes, comments, groups, groupMembers, notifications, friendRequests, statuses,
  type User, type InsertUser, type Message, type InsertMessage,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Group, type InsertGroup, type GroupMember, type Notification, type Status, type InsertStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getGroupMessages(groupId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  getLastMessages(userId: string): Promise<Record<string, Message>>;
  
  createPost(post: InsertPost & { authorId: string }): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  getUserPosts(userId: string): Promise<Post[]>;
  getPost(postId: string): Promise<Post | undefined>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  isPostLikedByUser(userId: string, postId: string): Promise<boolean>;
  getUserPostLikes(userId: string): Promise<Record<string, boolean>>;
  
  createComment(comment: InsertComment & { authorId: string }): Promise<Comment>;
  getPostComments(postId: string): Promise<Comment[]>;
  getAllPostComments(): Promise<Record<string, Comment[]>>;
  
  createGroup(group: InsertGroup & { creatorId: string }): Promise<Group>;
  getAllGroups(): Promise<Group[]>;
  getGroup(groupId: string): Promise<Group | undefined>;
  addGroupMember(groupId: string, userId: string, isAdmin: boolean): Promise<void>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  isUserGroupMember(groupId: string, userId: string): Promise<boolean>;
  getUserGroupMemberships(userId: string): Promise<Record<string, boolean>>;
  
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  searchUsers(query: string, excludeUserId: string): Promise<User[]>;
  sendFriendRequest(senderId: string, receiverId: string): Promise<void>;
  acceptFriendRequest(requestId: string): Promise<void>;
  rejectFriendRequest(requestId: string): Promise<void>;
  cancelFriendRequest(senderId: string, receiverId: string): Promise<void>;
  getPendingRequests(userId: string): Promise<any[]>;
  getSentRequests(userId: string): Promise<string[]>;
  countFollowers(userId: string): Promise<number>;
  countFollowing(userId: string): Promise<number>;

  createStatus(status: InsertStatus & { userId: string }): Promise<Status>;
  getUserStatuses(userId: string): Promise<Status[]>;
  getAllActiveStatuses(): Promise<Status[]>;
  deleteStatus(statusId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(eq(users.email, emailOrPhone), eq(users.phone, emailOrPhone))
    );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    // Get current user to track changes
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    const updateData: any = { ...data };
    
    // Track email changes
    if (data.email && data.email !== currentUser.email) {
      updateData.emailChangeCount = sql`${users.emailChangeCount} + 1`;
    }
    
    // Track username changes
    if (data.username && data.username !== currentUser.username) {
      updateData.usernameChangeCount = sql`${users.usernameChangeCount} + 1`;
    }
    
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return updated;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db.update(users).set({ 
      isOnline, 
      lastSeen: new Date() 
    }).where(eq(users.id, userId));
  }

  async createMessage(message: InsertMessage & { senderId: string }): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);
  }

  async getGroupMessages(groupId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.groupId, groupId)).orderBy(messages.createdAt);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId));
  }

  async getLastMessages(userId: string): Promise<Record<string, Message>> {
    const allMessages = await db.select().from(messages).where(
      or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
    ).orderBy(desc(messages.createdAt));

    const lastMessages: Record<string, Message> = {};
    for (const message of allMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      if (otherUserId && !lastMessages[otherUserId]) {
        lastMessages[otherUserId] = message;
      }
    }
    return lastMessages;
  }

  async createPost(post: InsertPost & { authorId: string }): Promise<Post> {
    const [created] = await db.insert(posts).values(post).returning();
    return created;
  }

  async getAllPosts(): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.authorId, userId)).orderBy(desc(posts.createdAt));
  }

  async getPost(postId: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    return post || undefined;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    const existing = await db.select().from(postLikes).where(
      and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))
    );

    if (existing.length === 0) {
      await db.insert(postLikes).values({ userId, postId });
      await db.update(posts).set({ 
        likesCount: sql`${posts.likesCount} + 1` 
      }).where(eq(posts.id, postId));
    }
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db.delete(postLikes).where(
      and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))
    );
    await db.update(posts).set({ 
      likesCount: sql`GREATEST(0, ${posts.likesCount} - 1)` 
    }).where(eq(posts.id, postId));
  }

  async isPostLikedByUser(userId: string, postId: string): Promise<boolean> {
    const [like] = await db.select().from(postLikes).where(
      and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))
    );
    return !!like;
  }

  async getUserPostLikes(userId: string): Promise<Record<string, boolean>> {
    const likes = await db.select().from(postLikes).where(eq(postLikes.userId, userId));
    const result: Record<string, boolean> = {};
    likes.forEach(like => {
      result[like.postId] = true;
    });
    return result;
  }

  async createComment(comment: InsertComment & { authorId: string }): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    await db.update(posts).set({ 
      commentsCount: sql`${posts.commentsCount} + 1` 
    }).where(eq(posts.id, comment.postId));
    return created;
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.createdAt);
  }

  async getAllPostComments(): Promise<Record<string, Comment[]>> {
    const allComments = await db.select().from(comments).orderBy(comments.createdAt);
    const result: Record<string, Comment[]> = {};
    allComments.forEach(comment => {
      if (!result[comment.postId]) {
        result[comment.postId] = [];
      }
      result[comment.postId].push(comment);
    });
    return result;
  }

  async createGroup(group: InsertGroup & { creatorId: string }): Promise<Group> {
    const [created] = await db.insert(groups).values(group).returning();
    await this.addGroupMember(created.id, group.creatorId, true);
    return created;
  }

  async getAllGroups(): Promise<Group[]> {
    return db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async getGroup(groupId: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
    return group || undefined;
  }

  async addGroupMember(groupId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const existing = await db.select().from(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );

    if (existing.length === 0) {
      await db.insert(groupMembers).values({ groupId, userId, isAdmin });
      await db.update(groups).set({ 
        membersCount: sql`${groups.membersCount} + 1` 
      }).where(eq(groups.id, groupId));
    }
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db.delete(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
    await db.update(groups).set({ 
      membersCount: sql`GREATEST(0, ${groups.membersCount} - 1)` 
    }).where(eq(groups.id, groupId));
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async isUserGroupMember(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db.select().from(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
    return !!member;
  }

  async getUserGroupMemberships(userId: string): Promise<Record<string, boolean>> {
    const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
    const result: Record<string, boolean> = {};
    memberships.forEach(membership => {
      result[membership.groupId] = true;
    });
    return result;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const conditions = [
      or(
        sql`${users.username} ILIKE ${`%${query}%`}`,
        sql`${users.name} ILIKE ${`%${query}%`}`,
        sql`${users.email} ILIKE ${`%${query}%`}`
      )
    ];
    
    if (excludeUserId) {
      conditions.push(sql`${users.id} != ${excludeUserId}`);
    }
    
    const results = await db.select().from(users).where(
      and(...conditions)
    ).limit(20);
    return results;
  }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    const existing = await db.select().from(friendRequests).where(
      and(
        eq(friendRequests.senderId, senderId),
        eq(friendRequests.receiverId, receiverId)
      )
    );

    if (existing.length === 0) {
      await db.insert(friendRequests).values({
        senderId,
        receiverId,
        status: 'pending'
      });
    }
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    await db.update(friendRequests).set({ status: 'accepted' }).where(eq(friendRequests.id, requestId));
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await db.update(friendRequests).set({ status: 'rejected' }).where(eq(friendRequests.id, requestId));
  }

  async getPendingRequests(userId: string): Promise<any[]> {
    const requests = await db.select().from(friendRequests).where(
      and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, 'pending')
      )
    );
    const withSenders = await Promise.all(
      requests.map(async (req) => {
        const sender = await this.getUser(req.senderId);
        return { ...req, sender };
      })
    );
    return withSenders;
  }

  async countFollowers(userId: string): Promise<number> {
    const followers = await db.select().from(friendRequests).where(
      and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, 'accepted')
      )
    );
    return followers.length;
  }

  async countFollowing(userId: string): Promise<number> {
    const following = await db.select().from(friendRequests).where(
      and(
        eq(friendRequests.senderId, userId),
        eq(friendRequests.status, 'accepted')
      )
    );
    return following.length;
  }

  async cancelFriendRequest(senderId: string, receiverId: string): Promise<void> {
    await db.delete(friendRequests).where(
      and(
        eq(friendRequests.senderId, senderId),
        eq(friendRequests.receiverId, receiverId),
        eq(friendRequests.status, 'pending')
      )
    );
  }

  async getSentRequests(userId: string): Promise<string[]> {
    const requests = await db.select({ receiverId: friendRequests.receiverId }).from(friendRequests).where(
      and(
        eq(friendRequests.senderId, userId),
        eq(friendRequests.status, 'pending')
      )
    );
    return requests.map(r => r.receiverId);
  }

  async createStatus(status: InsertStatus & { userId: string }): Promise<Status> {
    const [created] = await db.insert(statuses).values(status).returning();
    return created;
  }

  async getUserStatuses(userId: string): Promise<Status[]> {
    return db.select().from(statuses).where(eq(statuses.userId, userId)).orderBy(desc(statuses.createdAt));
  }

  async getAllActiveStatuses(): Promise<Status[]> {
    const now = new Date();
    return db.select().from(statuses).where(sql`${statuses.expiresAt} > ${now}`).orderBy(desc(statuses.createdAt));
  }

  async deleteStatus(statusId: string): Promise<void> {
    await db.delete(statuses).where(eq(statuses.id, statusId));
  }
}

export const storage = new DatabaseStorage();
