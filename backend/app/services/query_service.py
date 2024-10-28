from typing import List, Dict
from pydantic import BaseModel
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# no context chunks found Exception
class NoContextChunksFound(Exception):
    pass


class VideoReference(BaseModel):
    video_url: str
    timestamp: str
    text: str


class QueryService:
    def __init__(self, client, index):
        self.client = client
        self.index = index

    def create_messages(self, question: str, context_chunks: List[Dict]) -> List[Dict]:
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
                "content": """You are a knowledgeable assistant specialized in Ghana's parliamentary proceedings.
                Your role is to help people understand parliamentary discussions, bills, debates, and procedures
                in Ghana's Parliament. 

                When answering:
                - Use clear, accessible language
                - Present information objectively
                
                After your answer, suggest 3 relevant follow-up questions in this exact format:
                
                FOLLOW_UP_QUESTIONS:
                {
                    "questions": [
                        {
                            "text": "First follow-up question",
                            "category": "one of: [Related Bill, Debate Context, Impact Analysis, Procedure, Timeline, Key Players]",
                            "context": "Brief explanation of why this question is relevant"
                        },
                        {
                            "text": "Second follow-up question",
                            "category": "...",
                            "context": "..."
                        },
                        {
                            "text": "Third follow-up question",
                            "category": "...",
                            "context": "..."
                        }
                    ]
                }""",
            },
            {
                "role": "user",
                "content": f"""Context from parliamentary proceedings:
                    {context_text}
                    
                    Question: {question}
                    
                    Provide a clear explanation focusing on the parliamentary proceedings.""",
            },
        ]

        return messages

    async def query_pinecone(self, question: str, num_results: int = 4) -> List[Dict]:
        """Query Pinecone for relevant video segments."""

        # Get embeddings for the question
        response = self.client.embeddings.create(
            model="text-embedding-ada-002", input=question
        )
        query_embedding = response.data[0].embedding

        # Query Pinecone
        query_response = self.index.query(
            vector=query_embedding, top_k=num_results, include_metadata=True
        )

        # Extract and format results
        results = []
        for match in query_response.matches:
            results.append(match.metadata)

        return results

    async def query(self, question: str, num_results: int):
        context_chunks = await self.query_pinecone(question, num_results)

        if not context_chunks:
            raise NoContextChunksFound

        # Create messages for GPT-4
        messages = self.create_messages(question, context_chunks)

        # Get response from GPT-4
        completion = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0,
            max_tokens=1000,
        )

        full_response = completion.choices[0].message.content
        parts = full_response.split("FOLLOW_UP_QUESTIONS:")

        answer = parts[0].strip()
        follow_up_questions = []

        if len(parts) > 1:
            try:
                questions_json = json.loads(parts[1].strip())
                follow_up_questions = questions_json["questions"]
            except json.JSONDecodeError:
                logger.error("Failed to parse follow-up questions JSON")
                follow_up_questions = []

        # Format video references
        references = [
            VideoReference(
                video_url=chunk["timestamp_link"],
                timestamp=chunk["timestamp"],
                text=chunk["text"],
            )
            for chunk in context_chunks
        ]

        return answer, references, follow_up_questions
