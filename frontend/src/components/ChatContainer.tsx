import { Message } from "../types";
import ChatMessage from "./ChatMessage";

interface MessageContainerProps {
    messages: Message[];
}

const ChatContainer: React.FC<MessageContainerProps> = ({ messages }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
                <div key={index} className={`
            ${message.type === 'user'
                        ? 'text-white'
                        : 'text-gray-800'
                    }
          `}>
                    <ChatMessage message={message} />
                </div>
            ))}
        </div>
    );
};

export default ChatContainer;