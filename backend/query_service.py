from typing import List, Dict
from pydantic import BaseModel
import logging


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
                    - Use clear, accessible language to explain parliamentary terms and procedures
                    - Maintain formal and respectful tone when discussing parliamentary matters
                    - Present information objectively without political bias
                    - Focus on factual proceedings and official parliamentary business
                    - Be precise about legislative details, motions, and voting outcomes
                    
                    Provide direct, informative answers without mentioning video sources or timestamps
                    - these will be shown separately.""",
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

        print(context_chunks)

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

        return answer, references
