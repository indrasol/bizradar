import os
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse
from app.utils.logger import get_logger
from app.utils.db_utils import get_db_connection
from app.utils.subscription import ensure_active_access
from app.utils.redis_connection import RedisClient
import psycopg2

# Configure logging
logger = get_logger(__name__)

# Initialize router
conversation_router = APIRouter()

@conversation_router.get("/conversations")
async def get_conversations(user_id: str = Query(...), pursuit_id: str = Query(None, alias="pursuit_id")):
    """
    Get all conversations for a user, optionally filtered by pursuit_id
    """
    try:
        # Enforce subscription access
        ensure_active_access(user_id)
        
        # Try to get from cache first
        redis_client = RedisClient()
        cache_key = f"conversations:{user_id}:{pursuit_id or 'all'}"
        cached_conversations = redis_client.get_json(cache_key)
        if cached_conversations:
            logger.info(f"Returning {len(cached_conversations)} cached conversations for user {user_id}")
            return {"success": True, "conversations": cached_conversations, "from_cache": True}
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if pursuit_id:
            # Get conversations for specific pursuit
            query = """
                SELECT c.id, c.title, c.last_active, c.created_at, c.pursuit_id,
                       COUNT(m.id) as message_count
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                WHERE c.user_id = %s AND c.pursuit_id = %s
                GROUP BY c.id, c.title, c.last_active, c.created_at, c.pursuit_id
                ORDER BY c.last_active DESC
            """
            cursor.execute(query, (user_id, pursuit_id))
        else:
            # Get all conversations for user
            query = """
                SELECT c.id, c.title, c.last_active, c.created_at, c.pursuit_id,
                       COUNT(m.id) as message_count
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                WHERE c.user_id = %s
                GROUP BY c.id, c.title, c.last_active, c.created_at, c.pursuit_id
                ORDER BY c.last_active DESC
            """
            cursor.execute(query, (user_id,))
        
        conversations = []
        for row in cursor.fetchall():
            conversations.append({
                "id": row[0],
                "title": row[1],
                "lastActive": format_timestamp(row[2]),
                "createdAt": row[3].isoformat() if row[3] else None,
                "pursuitId": row[4],
                "messageCount": row[5]
            })
        
        cursor.close()
        conn.close()
        
        # Cache the results using existing RedisClient
        redis_client = RedisClient()
        cache_key = f"conversations:{user_id}:{pursuit_id or 'all'}"
        redis_client.set_json(cache_key, conversations, expiry=300)  # 5 minutes
        
        return {"success": True, "conversations": conversations, "from_cache": False}
        
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error retrieving conversations: {str(e)}"}
        )

@conversation_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: int, user_id: str = Query(...)):
    """
    Get all messages for a specific conversation
    """
    try:
        # Enforce subscription access
        ensure_active_access(user_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify conversation belongs to user and fetch pursuit_id for cache invalidation
        cursor.execute(
            "SELECT id, pursuit_id FROM conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id)
        )
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Conversation not found"}
            )
        conversation_pursuit_id = row[1]
        
        # Try to get from cache first
        redis_client = RedisClient()
        cache_key = f"messages:{conversation_id}"
        cached_messages = redis_client.get_json(cache_key)
        if cached_messages:
            logger.info(f"Returning {len(cached_messages)} cached messages for conversation {conversation_id}")
            return {"success": True, "messages": cached_messages, "from_cache": True}

        # Get messages from database
        cursor.execute(
            "SELECT id, type, content, timestamp, sam_gov_url, metadata FROM messages WHERE conversation_id = %s ORDER BY timestamp ASC",
            (conversation_id,)
        )

        messages = []
        for row in cursor.fetchall():
            messages.append({
                "id": f"{row[1]}-{row[0]}",  # type-id format
                "type": row[1],
                "content": row[2],
                "timestamp": row[3].isoformat() if row[3] else None,
                "samGovUrl": row[4],
                "metadata": row[5] if row[5] else {}
            })

        logger.info(f"Loaded {len(messages)} messages for conversation {conversation_id}")

        cursor.close()
        conn.close()

        # Cache the results
        redis_client.set_json(cache_key, messages, expiry=600)  # 10 minutes

        return {"success": True, "messages": messages, "from_cache": False}
        
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error retrieving messages: {str(e)}"}
        )

@conversation_router.post("/conversations")
async def create_conversation(request: Request):
    """
    Create a new conversation
    """
    try:
        data = await request.json()
        user_id = data.get("userId")
        pursuit_id = data.get("pursuitId")
        title = data.get("title", "New conversation")
        
        if not user_id:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "userId is required"}
            )
        
        # Enforce subscription access
        ensure_active_access(user_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create conversation
        cursor.execute(
            "INSERT INTO conversations (user_id, pursuit_id, title) VALUES (%s, %s, %s) RETURNING id",
            (user_id, pursuit_id, title)
        )
        
        conversation_id = cursor.fetchone()[0]
        
        # Create initial system message
        system_content = "I'm BizradarAI, your procurement assistant. I can help you analyze solicitations, find new opportunities, and prepare better proposals. What would you like help with today?"
        
        if pursuit_id:
            system_content = f"I'm BizradarAI, your procurement assistant. I notice you're asking about a pursuit. I can help you analyze this opportunity, understand requirements, and prepare better proposals. What specific information do you need about this pursuit?"
        
        cursor.execute(
            "INSERT INTO messages (conversation_id, type, content) VALUES (%s, %s, %s)",
            (conversation_id, "system", system_content)
        )
        
        logger.info(f"Created system message for conversation {conversation_id}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "conversationId": conversation_id}
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error creating conversation: {str(e)}"}
        )

@conversation_router.post("/conversations/{conversation_id}/messages")
async def add_message(conversation_id: int, request: Request):
    """
    Add a new message to a conversation
    """
    try:
        data = await request.json()
        user_id = data.get("userId")
        message_type = data.get("type")
        content = data.get("content")
        sam_gov_url = data.get("samGovUrl")
        metadata = data.get("metadata", {})
        
        if not all([user_id, message_type, content]):
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "userId, type, and content are required"}
            )
        
        # Enforce subscription access
        ensure_active_access(user_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify conversation belongs to user and fetch pursuit_id for cache invalidation
        cursor.execute(
            "SELECT id, pursuit_id FROM conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id)
        )
        convo_row = cursor.fetchone()
        if not convo_row:
            cursor.close()
            conn.close()
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Conversation not found"}
            )
        conversation_pursuit_id = convo_row[1]
        
        # Add message
        cursor.execute(
            "INSERT INTO messages (conversation_id, type, content, sam_gov_url, metadata) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (conversation_id, message_type, content, sam_gov_url, json.dumps(metadata))
        )
        
        message_id = cursor.fetchone()[0]
        
                # Update conversation last_active
        cursor.execute(
            "UPDATE conversations SET last_active = CURRENT_TIMESTAMP WHERE id = %s",
            (conversation_id,)
        )

        conn.commit()
        cursor.close()
        conn.close()

        # Invalidate caches since messages changed
        redis_client = RedisClient()
        redis_client.delete(f"messages:{conversation_id}")
        redis_client.delete(f"conversations:{user_id}:all")
        if conversation_pursuit_id:
            redis_client.delete(f"conversations:{user_id}:{conversation_pursuit_id}")

        return {"success": True, "messageId": message_id}
        
    except Exception as e:
        logger.error(f"Error adding message: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error adding message: {str(e)}"}
        )

@conversation_router.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: int, request: Request):
    """
    Update conversation title
    """
    try:
        data = await request.json()
        user_id = data.get("userId")
        title = data.get("title")
        
        if not all([user_id, title]):
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "userId and title are required"}
            )
        
        # Enforce subscription access
        ensure_active_access(user_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify conversation belongs to user and update
        cursor.execute(
            "UPDATE conversations SET title = %s WHERE id = %s AND user_id = %s RETURNING id",
            (title, conversation_id, user_id)
        )
        
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Conversation not found"}
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "Conversation updated"}
        
    except Exception as e:
        logger.error(f"Error updating conversation: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error updating conversation: {str(e)}"}
        )

@conversation_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int, user_id: str = Query(...)):
    """
    Delete a conversation and all its messages
    """
    try:
        # Enforce subscription access
        ensure_active_access(user_id)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify conversation belongs to user and delete
        cursor.execute(
            "DELETE FROM conversations WHERE id = %s AND user_id = %s RETURNING id",
            (conversation_id, user_id)
        )
        
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Conversation not found"}
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "Conversation deleted"}
        
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error deleting conversation: {str(e)}"}
        )

def format_timestamp(timestamp):
    """
    Format timestamp to human-readable format
    """
    if not timestamp:
        return "Unknown"
    
    now = datetime.now()
    diff = now - timestamp
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"
