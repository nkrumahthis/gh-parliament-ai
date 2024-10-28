import React from 'react'
import { Calendar, TrendingUp, ScrollText, HelpCircle } from 'lucide-react';

interface WelcomeProps {
    onSelectQuestion: (question: string) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onSelectQuestion }) => {

    const quickQuestions = [
        {
            text: "What was the biggest debate in Parliament this week?",
            icon: TrendingUp,
            description: "Get caught up on major parliamentary discussions"
        },
        {
            text: "What bills are Parliament currently discussing?",
            icon: ScrollText,
            description: "See what laws are being considered"
        },
        {
            text: "Which issues did MPs argue about the most in today's sitting?",
            icon: HelpCircle,
            description: "Key debates from today's session"
        },
        {
            text: "Can you give me a summary of what Parliament discussed today?",
            icon: Calendar,
            description: "Quick overview of today's proceedings"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Welcome Message */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Ghana Parliament Assistant
                </h1>
                <p className="text-gray-600">
                    Stay informed about Ghana's parliamentary proceedings. What would you like to know?
                </p>
            </div>

            {/* Quick Questions Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {quickQuestions.map((question, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectQuestion(question.text)}
                        className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all text-left group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <question.icon className="w-5 h-5 text-green-700 group-hover:text-green-600" />
                            <span className="font-medium text-gray-900 group-hover:text-green-700">
                                {question.text}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 ml-8">
                            {question.description}
                        </p>
                    </button>
                ))}
            </div>

            {/* Additional Help */}
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                    You can also ask specific questions about bills, debates, or MP statements
                </p>
            </div>
        </div>
    );
}

export default Welcome