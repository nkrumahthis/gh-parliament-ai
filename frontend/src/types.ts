export interface Reference {
    video_url: string;
    timestamp: string;
    text: string;
    video_title: string;
}

export interface FollowUpQuestion {
    text: string;
    category: string;
    context: string;
}

export interface Message {
    type: 'user' | 'assistant' | 'error';
    content: string;
    timestamp: string;
    references?: Reference[];
    follow_up_questions?: FollowUpQuestion[];
    isOptimistic?: boolean;
}

export interface Conversation {
    conversation_id: string;
    created_at: string;
    updated_at: string;
    messages: Message[];
}