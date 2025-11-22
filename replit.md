# ConnectHub - Secure Social Messaging Platform

## Overview
ConnectHub is a comprehensive social messaging web application that combines features similar to WhatsApp (real-time chat), Instagram (social posts), and Telegram (groups/channels). Built with React, TypeScript, Tailwind CSS, and PostgreSQL.

## Recent Changes (November 22, 2025)

### Phase 1: Complete Schema & Frontend Implementation
- **Data Models**: Defined complete database schema with Users, Messages, Posts, PostLikes, Comments, Groups, GroupMembers, and Notifications tables
- **Authentication**: Built signup/login pages with form validation using react-hook-form and zod
- **Feed Page**: Created post feed with create post dialog, post cards with like/comment functionality
- **Messages Page**: Implemented real-time messaging UI with conversation list and message bubbles
- **Groups Page**: Built group management with create group dialog, group cards, and group chat
- **Profile Page**: Created user profile with post timeline and stats
- **Settings Page**: Implemented profile editing with bio and avatar updates
- **Components**: Built reusable components including UserAvatar, PostCard, MessageBubble, ConversationListItem, GroupCard, AppSidebar
- **Design System**: Configured Inter font family, color tokens, and responsive layouts following Material Design 3 principles

## Project Architecture

### Frontend Stack
- **Framework**: React with TypeScript
- **Routing**: Wouter for SPA navigation
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Real-time**: WebSocket integration for live messaging (to be implemented)

### Backend Stack (To Be Implemented)
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.io for WebSocket connections
- **Security**: Rate limiting, input validation, CORS, Helmet
- **File Uploads**: Multer for media handling

### Database Schema
```
users: id, username, email, phone, password, name, bio, profilePicture, isOnline, lastSeen
messages: id, content, senderId, receiverId, groupId, mediaUrl, mediaType, isRead
posts: id, content, mediaUrl, mediaType, authorId, likesCount, commentsCount
postLikes: id, postId, userId
comments: id, content, postId, authorId
groups: id, name, description, groupPicture, creatorId, membersCount
groupMembers: id, groupId, userId, isAdmin
notifications: id, userId, type, content, relatedId, isRead
```

## Project Structure
```
client/
  src/
    components/
      ui/              - Shadcn UI components
      AppSidebar.tsx   - Main navigation sidebar
      UserAvatar.tsx   - User avatar with fallback
      PostCard.tsx     - Post display with interactions
      MessageBubble.tsx - Chat message bubble
      ConversationListItem.tsx - Chat list item
      GroupCard.tsx    - Group display card
      CreatePostDialog.tsx - Post creation modal
      CreateGroupDialog.tsx - Group creation modal
    pages/
      login.tsx        - Login page
      signup.tsx       - Signup page
      feed.tsx         - Post feed page
      messages.tsx     - Messaging page
      groups.tsx       - Groups page
      profile.tsx      - User profile page
      settings.tsx     - Settings page
    lib/
      auth.tsx         - Authentication context
      queryClient.ts   - TanStack Query setup
    App.tsx           - Main app with routes
    
server/
  routes.ts          - API routes (to be implemented)
  storage.ts         - Storage interface (to be implemented)
  
shared/
  schema.ts          - Drizzle schema and types
```

## User Preferences
- Focus on exceptional visual quality and polish
- Follow Material Design 3 principles from design_guidelines.md
- Use Inter font family for all UI text
- Implement real-time features with WebSockets
- Ensure responsive design across all breakpoints

## Next Steps
1. Implement backend API routes for authentication, users, posts, messages, groups
2. Set up PostgreSQL database with Drizzle migrations
3. Implement WebSocket server for real-time messaging
4. Connect frontend to backend with proper error handling
5. Test all user journeys end-to-end
