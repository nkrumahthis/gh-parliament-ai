import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, HelpCircle, ArrowRight } from 'lucide-react';
import SampleQuestions from './components/SampleQuestions';
import ChatContainer from './components/ChatContainer';
import { FollowUpQuestion, Message, Conversation } from './types';
import ConversationList from './components/ConversationList';

const App = () => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:8000/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/conversations/${conversationId}`);
      const conversation = await response.json();
      setCurrentConversation(conversation);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          num_results: 4,
          conversation_id: currentConversation?.conversation_id
        }),
      });

      const data = await response.json();

      // If this was a new conversation, fetch all conversations to get the new one
      if (!currentConversation?.conversation_id) {
        await fetchConversations();
      }

      // Load the current conversation with updated messages
      await loadConversation(data.conversation_id);
      
      setInput('');

    } catch (error) {
      console.error('Error:', error);
      // Handle error in the current conversation
      if (currentConversation) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, {
              type: 'error',
              content: 'Sorry, there was an error processing your request.',
              timestamp: new Date().toISOString()
            }]
          };
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get follow-up questions from the last assistant message
  const getFollowUpQuestions = (): FollowUpQuestion[] => {
    if (!currentConversation?.messages) return [];
    
    const assistantMessages = currentConversation.messages.filter(m => m.type === 'assistant');
    if (assistantMessages.length === 0) return [];
    
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
    return lastAssistantMessage.follow_up_questions || [];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="flex items-center space-x-2 mb-8">
          <div className="font-bold text-xl">🇬🇭 gh-parliament-ai</div>
        </div>

        <ConversationList
          conversations={conversations}
          activeConversation={currentConversation?.conversation_id || null}
          onSelectConversation={loadConversation}
        />
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
          <ChatContainer messages={currentConversation?.messages || []} />
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
                placeholder="Ask about parliamentary proceedings..."
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
            {getFollowUpQuestions().length > 0 ? (
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
          <SampleQuestions 
            setInput={setInput} 
            followUpQuestions={getFollowUpQuestions()} 
          />
        </div>
      </div>
    </div>
  );
};

export default App;