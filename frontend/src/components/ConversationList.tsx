import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '../types';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversation: string | null;
    onSelectConversation: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    activeConversation,
    onSelectConversation
}) => {
    return (
        <div className="space-y-1 overflow-y-auto">
            {conversations.map((conv) => (
                <button
                    key={conv.conversation_id}
                    onClick={() => onSelectConversation(conv.conversation_id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${activeConversation === conv.conversation_id
                        ? 'bg-green-50 border-l-2 border-green-600'
                        : 'hover:bg-gray-50'
                        }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                            {conv.conversation_id}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                            {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ConversationList;