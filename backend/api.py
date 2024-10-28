import os
from fastapi import FastAPI, HTTPException
import logging
from dotenv import load_dotenv
from query_service import QueryService, VideoReference, NoContextChunksFound
from typing import List
from pydantic import BaseModel
from pinecone import Pinecone
from openai import OpenAI

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
        # Get relevant video segments from Pinecone
        query_service = QueryService(client, index)
        answer, references, follow_up_questions = await query_service.query(
            request.question, request.num_results
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


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
