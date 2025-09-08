# BizradarAI Conversation System

This document describes the new dynamic conversation system that replaces the static conversation history in BizradarAI.

## Overview

The conversation system now stores all conversations and messages in a PostgreSQL database, allowing for:
- Persistent conversation history across sessions
- Conversation organization by pursuit ID
- User-specific conversation isolation
- Real-time conversation management (create, edit, delete)

## Database Schema

### Tables

#### `conversations`
- `id`: Primary key (SERIAL)
- `user_id`: User identifier (TEXT, NOT NULL)
- `pursuit_id`: Associated pursuit ID (TEXT, nullable)
- `title`: Conversation title (TEXT, NOT NULL)
- `last_active`: Last activity timestamp (TIMESTAMP)
- `created_at`: Creation timestamp (TIMESTAMP)
- `updated_at`: Last update timestamp (TIMESTAMP)

#### `messages`
- `id`: Primary key (SERIAL)
- `conversation_id`: Foreign key to conversations (INTEGER, NOT NULL)
- `type`: Message type - 'user', 'ai', or 'system' (TEXT, NOT NULL)
- `content`: Message content (TEXT, NOT NULL)
- `timestamp`: Message timestamp (TIMESTAMP)
- `sam_gov_url`: SAM.gov URL if applicable (TEXT, nullable)
- `metadata`: Additional message metadata (JSONB)

### Indexes
- `idx_conversations_user_id`: Fast user lookup
- `idx_conversations_pursuit_id`: Fast pursuit lookup
- `idx_conversations_last_active`: Fast sorting by activity
- `idx_messages_conversation_id`: Fast message retrieval
- `idx_messages_timestamp`: Fast message sorting

## Setup Instructions

### 1. Database Migration

Run the migration script to create the required tables:

```bash
cd backend
python run_conversation_migration.py
```

### 2. Backend Configuration

The conversation routes are automatically included in `main.py`. The system uses:
- Existing database connection utilities
- Existing subscription validation
- Existing logging system

### 3. Frontend Configuration

The frontend now uses the `ConversationService` class for all conversation operations. No additional configuration is required.

## API Endpoints

### Conversations

- `GET /api/conversations?user_id={userId}&pursuit_id={pursuitId}` - Get conversations
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/{id}` - Update conversation title
- `DELETE /api/conversations/{id}?user_id={userId}` - Delete conversation

### Messages

- `GET /api/conversations/{id}/messages?user_id={userId}` - Get conversation messages
- `POST /api/conversations/{id}/messages` - Add new message

## Frontend Features

### Conversation Management
- **Create**: New conversation button in sidebar
- **Select**: Click conversation to load messages
- **Edit**: Click edit icon to change title
- **Delete**: Click delete icon to remove conversation

### Automatic Pursuit Integration
- When navigating from a pursuit, the system automatically:
  1. Checks for existing conversations for that pursuit
  2. Creates a new conversation if none exists
  3. Loads the appropriate conversation context

### Real-time Updates
- Messages are saved to database immediately
- Conversation list updates automatically
- Last active timestamps are maintained

## Data Flow

### Message Sending
1. User types message and sends
2. Message saved to database as 'user' type
3. Request sent to AI service
4. AI response saved to database as 'ai' type
5. UI updated with both messages

### Conversation Loading
1. Component mounts and gets current user
2. Loads conversations for user (optionally filtered by pursuit)
3. Sets first conversation as active
4. Loads messages for active conversation

## Error Handling

- Database errors are logged and handled gracefully
- Failed message saves don't prevent UI updates
- Network errors show appropriate user feedback
- Subscription validation enforced on all endpoints

## Security Features

- User authentication required for all operations
- Users can only access their own conversations
- Subscription status validated on each request
- SQL injection protection via parameterized queries

## Performance Considerations

- Database indexes for fast lookups
- Messages loaded only when conversation is selected
- Conversation list pagination ready for future implementation
- Efficient timestamp formatting for display

## Future Enhancements

- Message search functionality
- Conversation export/import
- Message threading and replies
- Conversation sharing between users
- Advanced conversation analytics

## Troubleshooting

### Common Issues

1. **Migration fails**: Check database connection and permissions
2. **Conversations not loading**: Verify user authentication
3. **Messages not saving**: Check database connection and table existence
4. **Permission errors**: Ensure user has active subscription

### Debug Mode

Enable debug logging in the backend to see detailed conversation operations:

```python
# In logger configuration
logger.setLevel(logging.DEBUG)
```

## Testing

Test the system by:
1. Creating new conversations
2. Sending messages
3. Navigating between pursuits
4. Editing conversation titles
5. Deleting conversations
6. Verifying persistence across page reloads
