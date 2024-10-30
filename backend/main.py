import os
from fastapi import FastAPI, HTTPException
from mangum import Mangum
import logging
from dotenv import load_dotenv
from services.query_service import QueryService, VideoReference, NoContextChunksFound
from typing import List, Optional
from pydantic import BaseModel
from pinecone import Pinecone
from openai import OpenAI
from services.conversation_service import ConversationService

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Environment variables
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX = os.environ["PINECONE_INDEX"]

# Initialize clients
client = OpenAI()
index = Pinecone(api_key=PINECONE_API_KEY).Index(PINECONE_INDEX)

# Initialize services
query_service = QueryService(client, index)
conversation_service = ConversationService()


# Initialize FastAPI
app = FastAPI(title="gh-parliament-ai API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str
    num_results: int = 4
    conversation_id: Optional[str] = None


class FollowUpQuestion(BaseModel):
    text: str
    category: str
    context: str


class QueryResponse(BaseModel):
    conversation_id: str
    answer: str
    references: List[VideoReference]
    follow_up_questions: List[FollowUpQuestion]


class QueryError(Exception):
    pass


@app.post("/query", response_model=QueryResponse)
async def query_videos(request: QueryRequest):
    try:
        # Query and get answers for the conversation
        answer, references, follow_up_questions = await query_service.query(
            request.question, request.num_results
        )

        # Save both user and assistant messages in the conversation
        user_message = {
            "type": "user",
            "content": request.question
        }

        assistant_message = {
            "type": "assistant",
            "content": answer,
            "references": [ref.dict() for ref in references],
            "follow_up_questions": follow_up_questions
        }

        # Save user message
        conversation_id = await conversation_service.create_or_update_conversation(
            request.conversation_id, user_message
        )

        # Save assistant message
        await conversation_service.create_or_update_conversation(
            conversation_id, assistant_message
        )

        return QueryResponse(
            conversation_id=conversation_id,
            answer=answer,
            references=references,
            follow_up_questions=follow_up_questions,
        )
    except NoContextChunksFound:
        raise HTTPException(
            status_code=404,
            detail="No relevant video segments found for this question",
        )
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations")
async def get_conversations():
    return await conversation_service.get_conversations()

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    conversation = await conversation_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


handler = Mangum(app)
