import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import References from './References';

interface ChatMessageProps {
    message: Message;
}


const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl ${message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white shadow border border-gray-100'
                } rounded-lg p-4`}>
                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                        components={{
                            // Override default element styling
                            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                {/* References section */}
                {message.references && message.type === 'assistant' && (
                    <References references={message.references} />
                )}
            </div>
        </div>
    );
};

export default ChatMessage;