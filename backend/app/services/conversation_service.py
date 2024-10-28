from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4
from pymongo import MongoClient, DESCENDING
import os
from dotenv import load_dotenv

load_dotenv()

class ConversationService:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGODB_URI"))
        self.db = self.client[os.getenv("MONGODB_DB")]
        self.conversations = self.db.conversations

    async def create_or_update_conversation(
        self, conversation_id: Optional[str], message: dict
    ) -> str:
        """Create a new conversation or update existing one with new message."""
        now = datetime.now(timezone.utc)
        
        if not conversation_id:
            # Create new conversation
            conversation_id = str(uuid4())
            conversation = {
                "conversation_id": conversation_id,
                "created_at": now,
                "updated_at": now,
                "messages": [
                    {
                        "timestamp": now,
                        **message
                    }
                ]
            }
            self.conversations.insert_one(conversation)
        else:
            # Update existing conversation
            self.conversations.update_one(
                {"conversation_id": conversation_id},
                {
                    "$push": {
                        "messages": {
                            "timestamp": now,
                            **message
                        }
                    },
                    "$set": {"updated_at": now}
                }
            )
        
        return conversation_id

    async def get_conversations(self) -> List[dict]:
        """Get all conversations, sorted by most recent."""
        return list(
            self.conversations.find(
                {},
                {
                    "_id": 0,
                    "conversation_id": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "messages": {"$slice": ["$messages", 1]}  # Get only first message for preview
                }
            ).sort("updated_at", DESCENDING)
        )

    async def get_conversation(self, conversation_id: str) -> Optional[dict]:
        """Get a specific conversation by ID."""
        return self.conversations.find_one(
            {"conversation_id": conversation_id},
            {"_id": 0}
        )