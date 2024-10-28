import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Youtube, Clock, ArrowUpRight } from 'lucide-react';
import { Message } from '../types';

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
                {message.references && message.references.length > 0 && (
                    <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-500">References:</div>
                        {message.references.map((ref, idx) => (
                            <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                                    <Youtube size={12} />
                                    <span>{new URL(ref.video_url).searchParams.get('v')}</span> {/* TODO Get the video name not the url */}
                                    <Clock size={12} />
                                    <span>{ref.timestamp}</span>
                                    <a
                                        href={ref.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-blue-600 hover:text-blue-800"
                                    >
                                        <ArrowUpRight size={12} />
                                        <span>Watch</span>
                                    </a>
                                </div>
                                <div className="text-gray-700">{ref.text}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;