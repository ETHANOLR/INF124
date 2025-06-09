# Momento

<div align="center">
<img src="https://raw.githubusercontent.com/ETHANOLR/INF124/main/momento/frontend/src/Momento_with_name.png" alt="Momento Logo" width="200"/>
</div>

## Introduction

Momento is a powerful social media platform designed to provide a seamless user experience for creating, sharing, and discovering content. With a mobile-first responsive design, the platform ensures excellent user experience across all devices. Whether it's real-time messaging, multimedia content sharing, or social interactions, Momento meets the needs of modern social network users.

## Core Features

### User Management
- **User Authentication and Authorization**: Complete registration, login system, and role-based access control
- **Profile Management**: Customize personal information and privacy settings
- **Follow/Unfollow System**: Build user connections and personalized feeds

### Content Creation and Interaction
- **Multimedia Post Creation**: Drag-and-drop media uploads
- **Comment and Like System**: Engage with content through reactions and discussions
- **Content Categories/Hashtags**: Organize and discover content by themes
- **Bookmarks/Collections**: Save favorite content for later viewing

### Real-time Features
- **Live Updates**: Real-time notifications for likes, comments, and mentions
- **Real-time Messaging System**: Instant communication between users
- **Feed Updates**: Real-time content updates without page refresh

### Search and Discovery
- **Powerful Search**: Find users, posts, and topics via keywords, hashtags, and filters
- **Explore/Trending Page**: Discover popular and recommended content based on trends or user preferences

### Offline Functionality
- **Offline Viewing**: Cached feed content for offline access
- **Local Draft Saving**: Create content even when offline
- **Background Syncing**: Automatic data synchronization when connection is restored

## Bonus Features

### Social Media Integration
- **Share to External Platforms**: Share content to other social media
- **Import Contacts** from other social networks
- **Cross-post Content** to other platforms
- **Social Login Options**

### Geolocation Services
- **Location Tagging** in posts
- **Nearby Content Discovery**
- **Map View** for location-based posts
- **Local Trends and Recommendations**

### Notification System
- **Push Notifications** for important activities
- **In-app Notification Center**
- **Customizable Notification Preferences**

## Technical Features

- **Responsive Design**: Mobile-first adaptive layouts ensuring optimal experience on all devices
- **Interactive User Interfaces**: Dynamic content loading, live previews
- **APIs and Web Services**: Integration with payment gateways, social media sharing APIs, cloud storage for media uploads
- **Data Storage and Retrieval**: Efficient management of user data, content, and interactions
- **Security**: Robust authentication and authorization system protecting user data and privacy

## Main Pages

- **Home Page**: Platform introduction, login and registration entry points
- **Registration and Login**: Streamlined account creation and verification process
- **Content Page**: Personalized content recommendations and discovery
- **Messages Page**: Real-time chat and communication functionality
- **Profile**: User information and content management
- **Search Page**: Multi-functional search and filtering system
- **Settings Page**: Account, privacy, and notification preference management
- **Post Detail Page**: Shows the author's profile and post location (Country-City)

## User Flow

1. **Create Account**: Register via email and verify identity
2. **Personalize Profile**: Set avatar, personal information, and privacy options
3. **Discover Content**: Browse trending and recommended content
4. **Create Content**: Share photos, videos, and ideas
5. **Connect Users**: Follow friends and interesting creators
6. **Engage**: Like, comment, and share favorite content

## Tech Stack and Development

### Core Technologies
- **Frontend Framework**: React.js
- **Routing**: React Router DOM
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based login system
- **WebSocket**: Real-time chat powered by Socket.IO
- **Geolocation**: OpenCage API for IP-based location resolution

### Development Setup
1. **Clone the repository**:
   ```
   git clone [repository URL]
   cd momento
   ```

2. **Install frontend dependencies**:
   ```
   cd frontend
   npm install
   ```

3. **Install backend dependencies**:
   ```
   cd ../backend
   npm install
   ```

4. **Run the app**:
   - Frontend:
     ```
     npm start
     ```
   - Backend:
     ```
     npm run dev
     ```

## Development Status

Momento is currently in the development stage. The frontend interface design has been completed, and backend functionality is being implemented. We welcome feedback from developers and test users to help us build a better product.

### Feature Implementation Status

#### User Interface Components
| Feature | Status | Notes |
| ------- | ------ | ----- |
| Homepage Layout | ✅ Completed | Responsive design implemented |
| Navigation Menu | ✅ Completed | Mobile and desktop versions |
| User Profile UI | ✅ Completed | Avatar, bio, stats sections |
| Post Creation Modal | ✅ Completed | Text and media upload interface |
| Search Interface | ✅ Completed | Search bar and filters UI |
| Settings Page | ✅ Completed | Account, privacy, notification settings UI |
| Notification Center | ✅ Completed | Dropdown and full-page notification view |

#### Frontend Functionality
| Feature | Status | Notes |
| ------- | ------ | ----- |
| Routing Setup | ✅ Completed | All major pages connected |
| Form Validation | ✅ Completed | Client-side validation for inputs |
| Media Preview | ✅ Completed | Image preview in post creation |

#### Backend Integration
| Feature | Status | Notes |
| ------- | ------ | ----- |
| User Authentication | ✅ Completed | JWT-based login/register |
| Content Creation API | ✅ Completed | Posts, media, and location stored |
| Real-time Updates | ✅ Completed | WebSocket integrated |
| Search Functionality | ✅ Completed | API integration pending |
| User Interactions | ✅ Completed | Like, comment, follow actions complete |

#### Legend
- ✅ Completed: Feature is implemented and working

---

*Momento - Capture every moment, connect every person*
