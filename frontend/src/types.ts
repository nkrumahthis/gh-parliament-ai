interface Reference {
	video_url: string;
	timestamp: string;
	text: string;
}

export interface Message {
	type: "user" | "assistant" | "error";
	content: string;
	references?: Reference[];
}
