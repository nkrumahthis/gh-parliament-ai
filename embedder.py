# vector_store.py
import os
import json
import logging
from typing import List, Dict
from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai.embeddings import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX = os.environ["PINECONE_INDEX"]
TRANSCRIPTS_DIR = "./local_data/transcripts"


class VectorStoreManager:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=100
        )

        self.pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
        
        indexes_names = [index['name'] for index in self.pinecone_client.list_indexes().get('indexes')]

        # Initialize Pinecone
        if PINECONE_INDEX not in indexes_names:
            logger.info(f'Pinecone Index {PINECONE_INDEX} does not exist. Creating it')

            self.pinecone_client.create_index(
                PINECONE_INDEX,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )  # OpenAI embedding dimension
        else:
            logger.info(f'Pinecone Index {PINECONE_INDEX} found. Using it.')
        self.index = self.pinecone_client.Index(PINECONE_INDEX)

    def format_timestamp(self, seconds: float) -> str:
        """Convert seconds to HH:MM:SS format."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        seconds = int(seconds % 60)
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"

    def process_transcript(self, transcript_path: str) -> List[Dict]:
        """Process transcript into segments with metadata."""
        with open(transcript_path, "r", encoding="utf-8") as f:
            transcript_data = json.load(f)

        segments = []
        for segment in transcript_data["segments"]:
            timestamp = self.format_timestamp(segment["start"])
            video_link = f'{transcript_data["video_url"]}&t={int(segment["start"])}s'

            segments.append(
                {
                    "text": segment["text"],
                    "metadata": {
                        "video_id": transcript_data["video_id"],
                        "video_url": transcript_data["video_url"],
                        "timestamp": timestamp,
                        "timestamp_link": video_link,
                        "start": segment["start"],
                        "end": segment["end"],
                    },
                }
            )

        return segments

    def update_vectorstore(self, transcript_paths: List[str]):
        """Update Pinecone with new transcripts."""
        for transcript_path in transcript_paths:
            segments = self.process_transcript(transcript_path)

            # Create embeddings and upsert to Pinecone
            for i, segment in enumerate(segments):
                # Create unique ID for each segment
                segment_id = f"{segment['metadata']['video_id']}_{i}"

                # Get embedding for segment text
                embedding = self.embeddings.embed_query(segment["text"])

                # Upsert to Pinecone
                self.index.upsert(
                    vectors=[
                        (
                            segment_id,
                            embedding,
                            {"text": segment["text"], **segment["metadata"]},
                        )
                    ]
                )

            logger.info(f"Processed and uploaded transcript: {transcript_path}")


def main():
    # Process all transcripts in the directory
    manager = VectorStoreManager()
    transcript_paths = [
        os.path.join(TRANSCRIPTS_DIR, f)
        for f in os.listdir(TRANSCRIPTS_DIR)
        if f.endswith(".json")
    ]
    manager.update_vectorstore(transcript_paths)


if __name__ == "__main__":
    main()
