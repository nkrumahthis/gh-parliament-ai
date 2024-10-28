import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, HelpCircle, ArrowRight } from 'lucide-react';
import SampleQuestions from './components/SampleQuestions';
import ChatContainer from './components/ChatContainer';
import { FollowUpQuestion, Message } from './types';

const App = () => {

  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          num_results: 4
        }),
      });

      const data = await response.json();

      console.log(data)

      const assistantMessage: Message = {
        type: 'assistant',
        content: data.answer,
        references: data.references
      };

      setMessages(prev => [...prev, assistantMessage]);
      setFollowUpQuestions(data.follow_up_questions);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, there was an error processing your request.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-8">
          <div className="font-bold text-xl">🇬🇭 gh-parliament-ai</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-500">
            Ask questions about the video content. Get answers with direct references and timestamps.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="h-14 border-b border-gray-200 flex items-center px-6 bg-white">
          <div className="flex space-x-4">
            <h1 className="px-4 py-2 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
              Chat
            </h1>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <ChatContainer messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="h-24 border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSubmit} className="h-full flex items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the video content..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
                    {followUpQuestions.length > 0 ? (
                        <>
                            <ArrowRight className="w-4 h-4 text-green-700" />
                            <h3 className="font-medium text-gray-900">Related Questions</h3>
                        </>
                    ) : (
                        <>
                            <HelpCircle className="w-4 h-4 text-gray-500" />
                            <h3 className="font-medium text-gray-900">Suggested Questions</h3>
                        </>
                    )}
                </div>
          <SampleQuestions setInput={setInput} followUpQuestions={followUpQuestions}/>
        </div>
      </div>
    </div>
  );
};

export default App;