import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, HelpCircle, ArrowRight, Menu, X, MessageSquare } from 'lucide-react';
import SampleQuestions from './components/SampleQuestions';
import ChatContainer from './components/ChatContainer';
import { FollowUpQuestion, Conversation } from './types';
import ConversationList from './components/ConversationList';

const BACKEND = import.meta.env.VITE_BACKEND_BASE_URL;

const App = () => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle new follow-up questions
  useEffect(() => {
    const followUps = getFollowUpQuestions();
    if (followUps.length > 0) {
      setHasNewQuestions(true);
      // Subtle pulse animation for the message icon
      const messageIcon = document.getElementById('message-icon');
      if (messageIcon) {
        messageIcon.classList.add('animate-pulse');
        setTimeout(() => {
          messageIcon.classList.remove('animate-pulse');
        }, 2000);
      }
    }
  }, [currentConversation?.messages]);

  // Reset new questions indicator when sidebar is opened
  useEffect(() => {
    if (rightSidebarOpen) {
      setHasNewQuestions(false);
    }
  }, [rightSidebarOpen]);

  // Close sidebars when selecting a conversation on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [currentConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${BACKEND}/conversations`);
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string | null) => {
    if (conversationId === null || conversationId === undefined) {
      setCurrentConversation(null);
      return;
    }

    try {
      const response = await fetch(`${BACKEND}/conversations/${conversationId}`);
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
      const response = await fetch(`${BACKEND}/query`, {
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

      if (!currentConversation?.conversation_id) {
        await fetchConversations();
      }

      await loadConversation(data.conversation_id);
      setInput('');

    } catch (error) {
      console.error('Error:', error);
      if (currentConversation) {
        setCurrentConversation((prev) => {
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

  const getFollowUpQuestions = (): FollowUpQuestion[] => {
    if (!currentConversation?.messages) return [];

    const assistantMessages = currentConversation.messages.filter(m => m.type === 'assistant');
    if (assistantMessages.length === 0) return [];

    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
    return lastAssistantMessage.follow_up_questions || [];
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="p-2"
        >
          {leftSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="font-bold text-lg">🇬🇭 gh-parliament-ai</div>
        <div className="relative">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-2 relative"
            aria-label={hasNewQuestions ? "New follow-up questions available" : "View suggested questions"}
          >
            <MessageSquare id="message-icon" className={`w-6 h-6 ${hasNewQuestions ? 'text-green-600' : ''}`} />
            {hasNewQuestions && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
            )}
          </button>
          {hasNewQuestions && !rightSidebarOpen && (
            <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-lg text-xs whitespace-nowrap">
              New follow-up questions available
            </div>
          )}
        </div>
      </div>

      {/* Left Sidebar */}
      <div className={`
        fixed md:relative w-3/4 md:w-1/4 bg-white border-r border-gray-200 h-full z-40
        transition-transform duration-300 ease-in-out
        ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="hidden md:flex items-center space-x-2 p-4">
          <div className="font-bold text-xl">🇬🇭 gh-parliament-ai</div>
        </div>
        <ConversationList
          conversations={conversations}
          activeConversation={currentConversation?.conversation_id || null}
          onSelectConversation={loadConversation}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full md:h-screen w-full md:w-auto">
        {/* Desktop Navigation */}
        <div className="hidden md:flex h-14 border-b border-gray-200 items-center px-6 bg-white">
          <div className="flex space-x-4">
            <h1 className="px-4 py-2 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
              Chat
            </h1>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 mt-14 md:mt-0">
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
                className="w-full px-4 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                style={{
                  textOverflow: 'ellipsis'
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 bg-white"
                aria-label={isLoading ? "Sending..." : "Send message"}
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
      <div className={`
        fixed md:relative right-0 w-3/4 md:w-1/4 bg-white border-l border-gray-200 h-full z-40
        transition-transform duration-300 ease-in-out
        ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        md:translate-x-0
      `}>
        <div className="space-y-4 h-full flex flex-col p-4">
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