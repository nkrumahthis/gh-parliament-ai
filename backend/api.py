import os
from fastapi import FastAPI, HTTPException
import logging
from dotenv import load_dotenv
from query_service import QueryService, VideoReference, NoContextChunksFound
from typing import List
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


class FollowUpQuestion(BaseModel):
    text: str
    category: str
    context: str


class QueryResponse(BaseModel):
    answer: str
    references: List[VideoReference]
    follow_up_questions: List[FollowUpQuestion]


class QueryError(Exception):
    pass


@app.post("/query", response_model=QueryResponse)
async def query_videos(request: QueryRequest):
    try:
        # Create new conversation if conversation_id not provided
        print(request)
        if hasattr(request, "conversation_id"):
            conversation_id = request.conversation_id
        else:
            conversation_id = await conversation_service.create_conversation(
                request.question
            )

        # Get relevant video segments from Pinecone
        answer, references, follow_up_questions = await query_service.query(
            request.question, request.num_results
        )

        # Save messages to conversation
        await conversation_service.add_message(
            conversation_id, {"type": "user", "content": request.question}
        )

        await conversation_service.add_message(
            conversation_id,
            {
                "type": "assistant",
                "content": answer,
                "references": [ref.dict() for ref in references],
                "follow_up_questions": follow_up_questions,
            },
        )

        return QueryResponse(
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
