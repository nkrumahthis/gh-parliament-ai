import os
from typing import List, Dict
import logging
from pytubefix import YouTube
from pytubefix.cli import on_progress
from googleapiclient.discovery import build
import pathlib
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger()
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)

# Environment variables
YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_ID = os.environ["CHANNEL_ID"]
DOWNLOAD_DIR = os.environ.get("DOWNLOAD_DIR", "local_data/audio")
MAX_VIDEOS = 4

# Create download directory if it doesn't exist
pathlib.Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

class YoutubeAudioDownloader:
    def __init__(self):
        # Initialize YouTube API client
        self.youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    def get_recent_videos(self) -> List[Dict]:
        """Get the most recent videos from the channel."""
        videos = []

        response = (
            self.youtube.channels()
            .list(part="contentDetails,statistics", id=CHANNEL_ID)
            .execute()
        )

        uploads_playlist_id = response["items"][0]["contentDetails"][
            "relatedPlaylists"
        ]["uploads"]

        # Retrieve only the most recent videos
        playlist_response = (
            self.youtube.playlistItems()
            .list(
                part="snippet",
                playlistId=uploads_playlist_id,
                maxResults=MAX_VIDEOS
            )
            .execute()
        )

        for item in playlist_response["items"]:
            video_id = item["snippet"]["resourceId"]["videoId"]
            snippet = item["snippet"]
            video_info = {
                "video_id": video_id,
                "title": snippet["title"],
            }
            videos.append(video_info)

        return videos

    def download_to_disk(self, video: Dict) -> None:
        """Download video to local disk."""
        try:
            # Get video stream URL using pytube
            logger.info(f"https://www.youtube.com/watch?v={video['video_id']}")
            yt = YouTube(
                f"https://www.youtube.com/watch?v={video['video_id']}",
                on_progress_callback=on_progress
            )
            stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()

            if not stream:
                logger.error(f"No suitable stream found for video {video['video_id']}")
                return

            # Create safe filename
            safe_title = "".join(c for c in video['title'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"{video['video_id']}_{safe_title[:50]}.mp3"
            filepath = os.path.join(DOWNLOAD_DIR, filename)

            # Skip if file already exists
            if os.path.exists(filepath):
                logger.info(f"File already exists: {filepath}")
                return

            # Download the file
            logger.info(f"Downloading {video['title']} to {filepath}")
            stream.download(output_path=DOWNLOAD_DIR, filename=filename)
            
            logger.info(f"Successfully downloaded {video['title']}")

        except Exception as e:
            logger.error(f"Error downloading video {video['video_id']}: {str(e)}")

    def sync_videos(self):
        """Main synchronization process."""
        try:
            # Get most recent videos from channel
            logger.info(f"Fetching videos for channel {CHANNEL_ID}")
            videos = self.get_recent_videos()
            logger.info(f"Found {len(videos)} recent videos")

            # Download each video
            for video in videos:
                self.download_to_disk(video)

        except Exception as e:
            logger.error(f"Error in sync_videos: {str(e)}")
            raise

if __name__ == "__main__":
    downloader = YoutubeAudioDownloader()
    downloader.sync_videos()