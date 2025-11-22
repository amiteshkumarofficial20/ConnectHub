# Design Guidelines: Secure Social-Messaging Platform

## Design Approach

**Selected Approach:** Design System (Material Design 3) with references from Instagram, WhatsApp, and Telegram

**Justification:** This is a utility-focused social platform requiring efficient navigation between multiple core features (chat, feed, groups). Material Design 3's emphasis on clear hierarchy, adaptable layouts, and established patterns for messaging/social apps makes it ideal.

**Key References:**
- **WhatsApp Web:** Chat interface, message bubbles, online indicators
- **Instagram Web:** Feed cards, post interactions, profile layouts  
- **Telegram Web:** Channel/group management, sidebar navigation
- **Discord:** Multi-panel layout for balancing chat and community features

## Core Design Principles

1. **Feature Accessibility:** All primary features (Chat, Feed, Groups) must be one click away
2. **Real-time Clarity:** Visual feedback for online status, typing indicators, new messages
3. **Content Hierarchy:** Clear distinction between personal messages, public posts, and group communications
4. **Consistent Interactions:** Unified patterns for likes, comments, messaging across all features

## Layout System

**Primary Layout:** Three-panel desktop layout with collapsible panels for tablet/mobile
- Left Sidebar (280px): Navigation + quick access to chats/groups
- Main Content (flexible): Active view (Feed/Chat/Profile)
- Right Sidebar (320px, collapsible): Context panel (user info, group members, post details)

**Spacing Units:** Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card spacing: p-6
- Tight spacing: gap-2, gap-4

**Responsive Breakpoints:**
- Mobile: Single panel stack, bottom navigation bar
- Tablet: Two-panel (sidebar + main content)
- Desktop: Full three-panel layout

## Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter for all UI text
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale:**
- Headlines (User names in chat): text-base font-semibold
- Body (Messages, post text): text-sm
- Captions (Timestamps, metadata): text-xs text-gray-500
- Section Headers: text-lg font-semibold
- Page Titles: text-2xl font-bold

**Line Heights:**
- Headlines: leading-tight
- Body text: leading-normal
- Captions: leading-none

## Component Library

### Navigation

**Main Sidebar:**
- Fixed left panel with navigation icons + labels
- Sections: Feed, Messages, Groups, Profile, Settings
- Active state: Highlighted background (bg-blue-50), bold text, blue accent
- Unread badges: Small red circle with count (absolute positioning)

**Top Bar:**
- Height: h-16
- Contains: Logo, search bar (max-w-md), notifications bell, profile avatar
- Sticky positioning (sticky top-0)
- Border bottom: border-b

### Chat Components

**Conversation List Item:**
- Height: h-20, padding: p-4
- Layout: Avatar (w-12 h-12, rounded-full) + content area
- Content: Name (font-semibold), last message preview (text-sm truncate), timestamp (text-xs)
- Unread indicator: Bold text, blue dot, unread count badge
- Online status: Small green dot on avatar (absolute, bottom-0 right-0)

**Message Bubble:**
- Sent messages: bg-blue-500 text-white, rounded-2xl rounded-br-sm, ml-auto, max-w-sm
- Received messages: bg-gray-100, rounded-2xl rounded-bl-sm, mr-auto, max-w-sm
- Padding: px-4 py-2
- Timestamp: text-xs opacity-70, aligned right
- Seen indicator: Double checkmark icon for sent messages

**Chat Input:**
- Fixed bottom bar: h-16, px-4
- Attachment button (icon), text input (flex-1, rounded-full, px-4), send button (icon, primary color)
- Border: border-t

### Post Components

**Post Card:**
- Width: max-w-2xl mx-auto
- Background: bg-white, rounded-lg, border
- Padding: p-6
- Header: User avatar + name + timestamp (flex items-center gap-3)
- Content area: Post text (mt-4), media (mt-4, rounded-lg, max-h-96, object-cover)
- Actions bar: Like button, comment button, share button (flex gap-6, mt-4, pt-4, border-t)
- Like counter and comment count below actions

**Comment Section:**
- Nested under post, max-h-64, overflow-y-auto
- Each comment: Avatar + username + text (text-sm) + timestamp
- Padding: py-2, px-4

### User Components

**User Profile Card:**
- Avatar: w-24 h-24, rounded-full, mx-auto
- Username: text-xl font-bold, text-center, mt-4
- Bio: text-sm text-gray-600, text-center, mt-2
- Stats row: Posts/Followers/Following (flex justify-around, mt-6)
- Action buttons: Message/Follow (mt-6, full-width primary button)

**User Search Result:**
- Height: h-16, flex items-center, gap-3, p-4
- Avatar: w-10 h-10 rounded-full
- Name + username stack
- Follow/Message button (ml-auto)

### Group Components

**Group Card:**
- Similar to post card structure
- Group icon/avatar, name, member count, description
- Join/Leave button

**Group Chat:**
- Same message bubble style as 1-on-1
- Sender name above each message (text-xs font-semibold)
- Different avatar colors for different users

### Form Components

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border: border rounded-lg
- Focus: ring-2 ring-blue-500
- Labels: text-sm font-medium mb-2

**Buttons:**
- Primary: bg-blue-500 text-white h-12 px-6 rounded-lg font-medium
- Secondary: bg-white border border-gray-300 h-12 px-6 rounded-lg
- Icon buttons: w-10 h-10 rounded-full, hover:bg-gray-100

### Overlay Components

**Modal:**
- Backdrop: bg-black/50
- Container: bg-white rounded-xl max-w-md w-full p-6
- Header: text-xl font-bold mb-4
- Close button: Absolute top-4 right-4

**Notification Toast:**
- Position: fixed top-4 right-4, z-50
- Background: bg-white rounded-lg shadow-lg p-4
- Max width: max-w-sm
- Auto-dismiss after 3s

## Key Page Layouts

**Feed Page:**
- Centered column of post cards (max-w-2xl mx-auto)
- Create post button/card at top
- Infinite scroll for posts
- Spacing: space-y-6 between posts

**Messages Page:**
- Three-panel: Conversation list (left 320px) | Active chat (center flex-1) | User info (right 280px, collapsible)
- Conversation list: Searchable, sorted by recent
- Active chat: Message history (flex-1 overflow-y-auto) + input (fixed bottom)

**Profile Page:**
- Profile header card with cover photo option
- Tab navigation: Posts | Groups | About
- Content grid for posts (grid grid-cols-3 gap-1 on desktop)

**Settings Page:**
- Left sidebar: Settings categories
- Right content: Forms and options for selected category
- Sections: Profile, Privacy, Notifications, Security

## Icons

**Icon Library:** Heroicons (via CDN)
- Navigation: Use outline icons, solid for active state
- Actions: Outline icons (heart, comment, share, etc.)
- Size: w-5 h-5 for most UI, w-6 h-6 for prominent actions

## Images

**Profile/Group Avatars:**
- Circular (rounded-full)
- Default fallback: Colored circles with initials (bg-blue-500, etc.)

**Post Media:**
- Full width within post card
- Max height: max-h-96 to prevent excessive scrolling
- Aspect ratio: aspect-video for landscape, aspect-square for photos

**No Hero Image Required:** This is a functional web app, not a marketing site

## Animations

Use sparingly, only for:
- Notification toasts: Slide in from right
- Modal overlays: Fade in backdrop, scale up modal
- Message send: Brief highlight on new message
- Keep transitions quick: duration-200

## Visual Feedback

- Hover states: slight bg change (hover:bg-gray-50)
- Active chat/conversation: bg-blue-50 highlight
- Typing indicators: Three animated dots
- Loading states: Skeleton screens with subtle pulse animation
- Online status: Green dot, offline gray dot, last seen text