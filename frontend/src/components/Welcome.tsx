import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import SampleQuestions from './SampleQuestions';
import { FollowUpQuestion } from '../types';

interface WelcomeProps {
  handleQuestionSelect: (question: string) => void;
  followUpQuestions: FollowUpQuestion[];
}

// Separate Hero section for better component composition
const WelcomeHero: React.FC = () => (
  <div className="text-center mb-8 md:mb-12">
    <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full mb-6 mx-auto transform transition-transform hover:scale-105">
      <p className="md:w-10 md:h-10 text-4xl">🇬🇭</p>
      <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
    </div>
    
    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
      Welcome to Ghana Parliament AI
    </h2>
    
    <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
      Ask questions about parliamentary proceedings, bills, and debates. Get instant, accurate answers backed by official records.
    </p>
  </div>
);

// Separate Questions section for better organization
const QuestionsSection: React.FC<{
  handleQuestionSelect: (question: string) => void;
  followUpQuestions: FollowUpQuestion[];
}> = ({ handleQuestionSelect, followUpQuestions }) => (
  <div className="w-full max-w-2xl mx-auto">
    <div className="flex items-center gap-2 mb-4 px-4 md:px-0">
      <ArrowRight className="w-4 h-4 text-green-600" />
      <h3 className="font-medium text-gray-900">
        Start with a sample question
      </h3>
    </div>
    
    <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
      <SampleQuestions
        handleQuestionSelect={handleQuestionSelect}
        followUpQuestions={followUpQuestions}
      />
    </div>
  </div>
);

const Welcome: React.FC<WelcomeProps> = ({ 
  handleQuestionSelect,
  followUpQuestions 
}) => {
  return (
    <div className="relative flex flex-col h-full">
      {/* Semi-transparent gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-green-50/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative flex flex-col h-full px-4 md:px-6 pt-8 md:pt-16 pb-4">
        <WelcomeHero />
        
        {/* Questions Container */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-hidden">
          <QuestionsSection 
            handleQuestionSelect={handleQuestionSelect}
            followUpQuestions={followUpQuestions}
          />
        </div>

        {/* Desktop-only keyboard shortcut hint */}
        <div className="hidden md:block text-center text-sm text-gray-400 mt-8">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">↵ Enter</kbd> to send message
        </div>
      </div>
    </div>
  );
};

// Export named components for better debugging and component inspection
export { WelcomeHero, QuestionsSection };
export default Welcome;