import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import References from './References';

interface ChatMessageProps {
    message: Message;
}

const ANALYSIS_STEPS = [
    "Retrieving parliamentary data",
    "Analyzing parliamentary proceedings",
    "Creating comprehensive answer"
];

const getRandomDelay = () => Math.floor(Math.random() * 3000) + 1000; // 1-3 seconds

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const [displayedContent, setDisplayedContent] = useState(message.content);
    const [currentStep, setCurrentStep] = useState(0);
    const isThinking = message.isOptimistic && message.type === 'assistant';

    useEffect(() => {
        if (isThinking) {
            let dots = '';
            let step = 0;
            
            // Update dots animation
            const dotsInterval = setInterval(() => {
                dots = dots.length >= 3 ? '' : dots + '.';
                setDisplayedContent(`${ANALYSIS_STEPS[step]}${dots}`);
            }, 500);

            // Progress through steps
            const progressSteps = async () => {
                for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
                    step = i;
                    setCurrentStep(i);
                }
            };

            progressSteps();

            return () => {
                clearInterval(dotsInterval);
            };
        } else {
            setDisplayedContent(message.content);
            setCurrentStep(0);
        }
    }, [message.content, isThinking]);

    return (
        <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
                max-w-2xl rounded-lg p-4
                ${message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-100'
                        : 'bg-white shadow border border-gray-100'
                }
                ${isThinking ? 'animate-pulse' : ''}
                transition-all duration-200
            `}>
                <div className={`
                    prose prose-sm max-w-none
                    ${message.type === 'user' ? 'text-white' : ''}
                    ${message.type === 'error' ? 'text-red-800' : ''}
                `}>
                    {isThinking ? (
                        <div className="space-y-2">
                            {ANALYSIS_STEPS.map((step, index) => (
                                <div 
                                    key={index}
                                    className={`
                                        flex items-center gap-2
                                        ${index > currentStep ? 'text-gray-400' : ''}
                                        ${index === currentStep ? 'text-green-600 font-medium' : ''}
                                        ${index < currentStep ? 'text-gray-500 line-through' : ''}
                                    `}
                                >
                                    {index === currentStep ? (
                                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                                    ) : index < currentStep ? (
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                    )}
                                    {step}
                                    {index === currentStep && '...'}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ReactMarkdown
                            components={{
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
                            {displayedContent}
                        </ReactMarkdown>
                    )}
                </div>

                {/* References section - only show for non-optimistic assistant messages */}
                {message.references && message.type === 'assistant' && !isThinking && (
                    <References references={message.references} />
                )}
            </div>
        </div>
    );
};

export default ChatMessage;