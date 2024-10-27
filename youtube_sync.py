import os
from typing import List, Dict, Optional
from datetime import datetime, timezone
import logging
from pymongo import MongoClient
from pymongo.collection import Collection
from pytubefix import YouTube
from pytubefix.cli import on_progress
import boto3
import requests
from googleapiclient.discovery import build

from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger()
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)

# Environment variables
MONGODB_URI = os.environ["MONGODB_URI"]
MONGODB_DB = os.environ["MONGODB_DB"]
YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_ID = os.environ["CHANNEL_ID"]
S3_BUCKET = os.environ["S3_BUCKET"]
S3_PREFIX = os.environ.get("S3_PREFIX", "videos/")


class YouTubeSync:
    def __init__(self):
        # Initialize MongoDB connection
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client[MONGODB_DB]
        self.videos_collection: Collection = self.db.videos

        # Initialize YouTube API client
        self.youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        # Initialize S3 client
        self.s3 = boto3.client("s3")

    def get_channel_videos(self):
        videos = []
        next_page_token = None

        response = (
            self.youtube.channels()
            .list(part="contentDetails,statistics", id=CHANNEL_ID)
            .execute()
        )

        print(response)

        uploads_playlist_id = response["items"][0]["contentDetails"][
            "relatedPlaylists"
        ]["uploads"]

        # Retrieve all videos in the uploads playlist
        while True:
            playlist_response = (
                self.youtube.playlistItems()
                .list(
                    part="snippet",
                    playlistId=uploads_playlist_id,
                    maxResults=50,
                    pageToken=next_page_token,
                )
                .execute()
            )

            for item in playlist_response["items"]:
                video_id = item["snippet"]["resourceId"]["videoId"]
                snippet = item["snippet"]
                video_info = {
                    "video_id": video_id,
                    "title": snippet["title"],
                    "description": snippet["description"],
                    "published_at": snippet["publishedAt"],
                    "thumbnail_url": snippet["thumbnails"]["high"]["url"],
                }
                videos.append(video_info)

            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break

        return videos

    def get_new_videos(self, videos: List[Dict]) -> List[Dict]:
        """Find videos that haven't been downloaded yet."""

        existing_video_ids = set(
            doc["video_id"] for doc in self.videos_collection.find({}, {"video_id": 1})
        )

        return [
            video for video in videos if video["video_id"] not in existing_video_ids
        ]

    def stream_to_s3(self, video: Dict) -> Optional[str]:
        """Stream video directly from YouTube to S3."""
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
                return None

            # Prepare S3 multipart upload
            s3_key = f"{S3_PREFIX}{video['video_id']}.mp3"

            # Initialize multipart upload
            mpu = self.s3.create_multipart_upload(
                Bucket=S3_BUCKET, Key=s3_key, ContentType="video/mp4"
            )

            try:
                # Start streaming from YouTube
                logger.info(
                    f"Streaming {video['title']} {video['video_id']} to s3 bucket"
                )

                response = requests.get(stream.url, stream=True)
                response.raise_for_status()

                # Calculate chunk size (5MB is minimum for multipart upload)
                chunk_size = 5 * 1024 * 1024  # 5MB
                parts = []
                part_number = 1

                # Stream chunks directly to S3
                for chunk_start in range(0, len(response.content), chunk_size):
                    chunk = response.content[chunk_start : chunk_start + chunk_size]

                    # Upload part
                    part = self.s3.upload_part(
                        Bucket=S3_BUCKET,
                        Key=s3_key,
                        PartNumber=part_number,
                        UploadId=mpu["UploadId"],
                        Body=chunk,
                    )

                    parts.append({"PartNumber": part_number, "ETag": part["ETag"]})
                    part_number += 1

                # Complete multipart upload
                self.s3.complete_multipart_upload(
                    Bucket=S3_BUCKET,
                    Key=s3_key,
                    UploadId=mpu["UploadId"],
                    MultipartUpload={"Parts": parts},
                )

                logger.info(
                    f"Completed successfully Streaming {video['title']} {video['video_id']} to s3 bucket"
                )

                return s3_key

            except Exception as e:
                # Abort multipart upload if something goes wrong
                self.s3.abort_multipart_upload(
                    Bucket=S3_BUCKET, Key=s3_key, UploadId=mpu["UploadId"]
                )
                raise e

        except Exception as e:
            logger.error(f"Error streaming video {video['video_id']}: {str(e)}")
            return None

    def update_database(self, video: Dict, s3_key: str):
        """Update MongoDB with video metadata."""
        video_doc = {
            **video,
            "s3_key": s3_key,
            "downloaded_at": datetime.now(tz=timezone.utc),
            "last_checked": datetime.now(tz=timezone.utc),
            "processed_at": None
        }

        self.videos_collection.insert_one(video_doc)

    def sync_videos(self):
        """Main synchronization process."""
        try:
            # Get all videos from channel
            logger.info(f"Fetching videos for channel {CHANNEL_ID}")
            videos = self.get_channel_videos()

            # Find new videos
            new_videos = self.get_new_videos(videos)
            logger.info(f"Found {len(new_videos)} new videos to download")

            # Stream and process each new video
            for video in new_videos:
                logger.info(video)
                logger.info(f"Processing video: {video['title']}")

                # Stream to S3
                s3_key = self.stream_to_s3(video)

                if s3_key:
                    # Update database
                    self.update_database(video, s3_key)
                    logger.info(f"Successfully processed video: {video['title']}")
                else:
                    logger.error(f"Failed to process video: {video['title']}")

        except Exception as e:
            logger.error(f"Error in sync_videos: {str(e)}")
            raise

        finally:
            # Clean up connections
            self.client.close()


def lambda_handler(event, context):
    """AWS Lambda handler function."""
    try:
        syncer = YouTubeSync()
        syncer.sync_videos()

        return {
            "statusCode": 200,
            "body": "Video synchronization completed successfully",
        }

    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return {"statusCode": 500, "body": f"Error: {str(e)}"}


if __name__ == "__main__":
    # logger.info("let's go")
    syncer = YouTubeSync()
    syncer.sync_videos()
