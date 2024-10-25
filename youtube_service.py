import os
from dotenv import load_dotenv
from googleapiclient.discovery import build

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
CHANNEL_ID = os.getenv("CHANNEL_ID")

class YoutubeService:
    def __init__(self):
        self.youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    def get_channel_videos(self):
        videos = []
        next_page_token = None

        response = (
            self.youtube.channels().list(part="contentDetails,statistics", id=CHANNEL_ID).execute()
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
                video_title = item["snippet"]["title"]
                videos.append({"id": video_id, "title": video_title})

            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break

        return videos