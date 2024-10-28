import os
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pinecone import Pinecone
from openai import OpenAI
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Video RAG API")

# Environment variables
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX = os.environ["PINECONE_INDEX"]

# Initialize clients
client = OpenAI()
index = Pinecone(api_key=PINECONE_API_KEY).Index(PINECONE_INDEX)


class QueryRequest(BaseModel):
    question: str
    num_results: int = 4


class VideoReference(BaseModel):
    video_url: str
    timestamp: str
    text: str


class QueryResponse(BaseModel):
    answer: str
    references: List[VideoReference]


def create_messages(question: str, context_chunks: List[Dict]) -> List[Dict]:
    """Create messages for OpenAI chat completion."""

    # Format context with video references
    formatted_contexts = []
    for chunk in context_chunks:
        formatted_contexts.append(
            f"[Video Segment: {chunk['timestamp']} - {chunk['timestamp_link']}]\n{chunk['text']}"
        )

    context_text = "\n\n".join(formatted_contexts)

    # Create system and user messages
    messages = [
        {
            "role": "system",
            "content": """You are a helpful AI assistant that answers questions based on video content. 
            Your answers should be accurate and based only on the provided video segments.
            When you reference information, always mention which video and timestamp it came from.
            Format your answer in two parts:
            1. A clear, direct answer to the question
            2. Your source references as a list, showing which parts of which videos support your answer""",
        },
        {
            "role": "user",
            "content": f"""Context from videos:
            {context_text}
            
            Question: {question}
            
            Please provide an answer based on these video segments, including specific references to the source timestamps.""",
        },
    ]

    return messages


async def query_pinecone(question: str, num_results: int = 4) -> List[Dict]:
    """Query Pinecone for relevant video segments."""

    # Get embeddings for the question
    response = client.embeddings.create(model="text-embedding-ada-002", input=question)
    query_embedding = response.data[0].embedding

    # Query Pinecone
    query_response = index.query(
        vector=query_embedding, top_k=num_results, include_metadata=True
    )

    # Extract and format results
    results = []
    for match in query_response.matches:
        results.append(match.metadata)

    return results


@app.post("/query", response_model=QueryResponse)
async def query_videos(request: QueryRequest):
    try:
        # Get relevant video segments from Pinecone
        context_chunks = await query_pinecone(request.question, request.num_results)

        if not context_chunks:
            raise HTTPException(
                status_code=404,
                detail="No relevant video segments found for this question",
            )

        # Create messages for GPT-4
        messages = create_messages(request.question, context_chunks)

        # Get response from GPT-4
        completion = client.chat.completions.create(
            model="gpt-4-turbo-preview",  # or "gpt-4" depending on your preference
            messages=messages,
            temperature=0,
            max_tokens=1000,
        )

        answer = completion.choices[0].message.content

        # Format video references
        references = [
            VideoReference(
                video_url=chunk["timestamp_link"],
                timestamp=chunk["timestamp"],
                text=chunk["text"],
            )
            for chunk in context_chunks
        ]

        return QueryResponse(answer=answer, references=references)

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
