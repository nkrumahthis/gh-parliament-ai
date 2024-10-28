import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from openai import OpenAI
from pydub import AudioSegment
import tempfile
from datetime import datetime
import shutil

from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables and constants
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
AUDIO_DIR = "./local_data/audio"
TRANSCRIPTS_DIR = "./local_data/transcripts"
CHUNK_LENGTH = 10 * 60 * 1000  # 10 minutes in milliseconds
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB in bytes

class WhisperTranscriber:
    def __init__(self):
        Path(TRANSCRIPTS_DIR).mkdir(parents=True, exist_ok=True)
        self.client = OpenAI()

    def get_video_id_from_filename(self, filename: str) -> str:
        """Extract video ID from filename (format: videoId_title.mp3)."""
        return filename.split('_')[0]

    def split_audio(self, audio_path: str) -> List[str]:
        """Split audio file into smaller chunks."""
        logger.info(f"Splitting audio file: {audio_path}")
        
        # Create temporary directory for chunks
        temp_dir = tempfile.mkdtemp()
        chunk_paths = []

        try:
            # Load audio file
            audio = AudioSegment.from_file(audio_path)
            
            # Split audio into chunks
            for i, start in enumerate(range(0, len(audio), CHUNK_LENGTH)):
                end = start + CHUNK_LENGTH
                chunk = audio[start:end]
                
                # Save chunk to temporary file
                chunk_path = os.path.join(temp_dir, f"chunk_{i:03d}.mp3")
                chunk.export(chunk_path, format="mp3")
                chunk_paths.append(chunk_path)
                
            logger.info(f"Split audio into {len(chunk_paths)} chunks")
            return chunk_paths

        except Exception as e:
            logger.error(f"Error splitting audio file: {str(e)}")
            shutil.rmtree(temp_dir)
            raise

    def transcribe_chunk(self, chunk_path: str, start_time: float = 0) -> Optional[Dict]:
        """Transcribe a single audio chunk."""
        try:
            with open(chunk_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-1",
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )

            # Adjust timestamps based on chunk position
            adjusted_segments = []
            for segment in transcript.segments:
                adjusted_segment = dict(segment)
                adjusted_segment["start"] += start_time
                adjusted_segment["end"] += start_time
                adjusted_segments.append(adjusted_segment)

            return adjusted_segments

        except Exception as e:
            logger.error(f"Error transcribing chunk {chunk_path}: {str(e)}")
            return None

    def merge_transcripts(self, segments: List[Dict]) -> Dict:
        """Merge transcript segments and ensure continuous timing."""
        merged_segments = []
        
        for segment in segments:
            if merged_segments and abs(segment["start"] - merged_segments[-1]["end"]) < 0.5:
                # If segments are close together, merge them
                merged_segments[-1]["text"] += " " + segment["text"]
                merged_segments[-1]["end"] = segment["end"]
            else:
                merged_segments.append(segment)

        return merged_segments

    def transcribe_audio(self, audio_path: str) -> Optional[Dict]:
        """Transcribe audio file by splitting into chunks and merging results."""
        try:
            logger.info(f"Processing: {audio_path}")
            
            # Split audio into chunks
            chunk_paths = self.split_audio(audio_path)
            temp_dir = os.path.dirname(chunk_paths[0])
            
            try:
                # Process each chunk
                all_segments = []
                current_time = 0
                
                for chunk_path in chunk_paths:
                    logger.info(f"Transcribing chunk: {chunk_path}")
                    segments = self.transcribe_chunk(chunk_path, current_time)
                    
                    if segments:
                        all_segments.extend(segments)
                        # Update current_time for next chunk
                        if segments:
                            current_time = max(seg["end"] for seg in segments)
                    
                if not all_segments:
                    return None

                # Merge segments
                merged_segments = self.merge_transcripts(all_segments)
                
                video_id = self.get_video_id_from_filename(os.path.basename(audio_path))
                
                transcript_data = {
                    "video_id": video_id,
                    "video_url": f"https://youtube.com/watch?v={video_id}",
                    "audio_filename": os.path.basename(audio_path),
                    "segments": merged_segments,
                    "processed_at": datetime.now().isoformat(),
                }

                return transcript_data

            finally:
                # Clean up temporary files
                shutil.rmtree(temp_dir)

        except Exception as e:
            logger.error(f"Error transcribing {audio_path}: {str(e)}")
            return None

    def process_new_audios(self) -> List[str]:
        """Process new audio files and return list of processed transcript paths."""
        processed_transcripts = []
        
        try:
            audio_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith('.mp3')]
            
            for audio_filename in audio_files:
                transcript_path = os.path.join(TRANSCRIPTS_DIR, f"{os.path.splitext(audio_filename)[0]}.json")
                
                if os.path.exists(transcript_path):
                    processed_transcripts.append(transcript_path)
                    continue

                audio_path = os.path.join(AUDIO_DIR, audio_filename)
                transcript_data = self.transcribe_audio(audio_path)

                if transcript_data:
                    with open(transcript_path, 'w', encoding='utf-8') as f:
                        json.dump(transcript_data, f, ensure_ascii=False, indent=2)
                    processed_transcripts.append(transcript_path)
                    logger.info(f"Saved transcript to: {transcript_path}")

        except Exception as e:
            logger.error(f"Error in process_new_audios: {str(e)}")
            
        return processed_transcripts

def main():
    transcriber = WhisperTranscriber()
    transcriber.process_new_audios()

if __name__ == "__main__":
    main()