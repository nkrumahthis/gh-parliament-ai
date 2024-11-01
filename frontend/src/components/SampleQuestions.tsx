import React from 'react';
import { Tag } from 'lucide-react';
import { FollowUpQuestion } from '../types';

interface SampleQuestionsProps {
    handleQuestionSelect: (question: string) => void;
    followUpQuestions: FollowUpQuestion[];
}

const SampleQuestions: React.FC<SampleQuestionsProps> = ({
    handleQuestionSelect,
    followUpQuestions
}) => {
    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
        'Related Bill': {
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-100'
        },
        'Debate Context': {
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-100'
        },
        'Impact Analysis': {
            bg: 'bg-purple-50',
            text: 'text-purple-700',
            border: 'border-purple-100'
        },
        'Procedure': {
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            border: 'border-orange-100'
        },
        'Timeline': {
            bg: 'bg-red-50',
            text: 'text-red-700',
            border: 'border-red-100'
        },
        'Key Players': {
            bg: 'bg-indigo-50',
            text: 'text-indigo-700',
            border: 'border-indigo-100'
        }
    };

    const defaultQuestions: FollowUpQuestion[] = [
        {
            text: "What was the biggest debate in Parliament this week?",
            category: "Timeline",
            context: "Get an overview of the most significant parliamentary discussions"
        },
        {
            text: "What bills are Parliament currently discussing?",
            category: "Related Bill",
            context: "Learn about ongoing legislative proceedings"
        },
        {
            text: "Can you give me a summary of what Parliament discussed today?",
            category: "Debate Context",
            context: "Quick overview of today's parliamentary session"
        },
        {
            text: "What are the key decisions made in Parliament today?",
            category: "Impact Analysis",
            context: "Understanding the main outcomes of today's proceedings"
        }
    ];

    const questionsToShow = followUpQuestions.length > 0 ? followUpQuestions : defaultQuestions;

    return (
        <div className="flex flex-col p-4 space-y-4 gap-4 overflow-y-auto flex-1">
            {questionsToShow.map((question, index) => {
                const colors = categoryColors[question.category] || {
                    bg: 'bg-gray-50',
                    text: 'text-gray-700',
                    border: 'border-gray-100'
                };

                return (

                    <button
                        key={index}
                        className={`rounded-lg border ${colors.border}`}
                        onClick={() => handleQuestionSelect(question.text)}
                    >   <div>
                            <div className={`w-full text-left p-3 ${colors.bg} rounded-t-lg hover:opacity-90 transition-opacity`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Tag className={`w-3 h-3 ${colors.text}`} />
                                    <span className={`text-xs font-medium ${colors.text}`}>
                                        {question.category}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    {question.text}
                                </p>
                            </div>
                            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 text-left">
                                {question.context}
                            </div>
                        </div>
                    </button>



                );
            })}
        </div>
    );
};

export default SampleQuestions;