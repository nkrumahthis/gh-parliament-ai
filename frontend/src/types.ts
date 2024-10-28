export interface Reference {
    video_url: string;
    timestamp: string;
    text: string;
}

export interface FollowUpQuestion {
    text: string;
    category: string;
    context: string;
}

export interface Message {
    type: 'user' | 'assistant';
    content: string;
    timestamp: string;
    references?: Reference[];
    follow_up_questions?: FollowUpQuestion[];
}

export interface Conversation {
    conversation_id: string;
    created_at: string;
    updated_at: string;
    messages: Message[];
}