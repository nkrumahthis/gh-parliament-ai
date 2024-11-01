import { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle, ArrowRight, Menu, X, MessageSquare } from 'lucide-react';
import SampleQuestions from './components/SampleQuestions';
import ChatContainer from './components/ChatContainer';
import { FollowUpQuestion, Conversation, Message } from './types';
import ConversationList from './components/ConversationList';
import MessageInput from './components/MessageInput';

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
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const getFollowUpQuestions = useCallback((): FollowUpQuestion[] => {
    if (!currentConversation?.messages) return [];

    const assistantMessages = currentConversation.messages.filter(m => m.type === 'assistant');
    if (assistantMessages.length === 0) return [];

    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
    return lastAssistantMessage.follow_up_questions || [];
  }, [currentConversation?.messages]); // Only recreate when messages change


  // Handle new follow-up questions
  useEffect(() => {
    const followUps = getFollowUpQuestions();
    if (followUps.length > 0) {
      setHasNewQuestions(true);
      const messageIcon = document.getElementById('message-icon');
      if (messageIcon) {
        messageIcon.classList.add('animate-pulse');
        setTimeout(() => {
          messageIcon.classList.remove('animate-pulse');
        }, 2000);
      }
    }
  }, [getFollowUpQuestions]);

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

  const handleMessageSubmit = async (message: string) => {
    if (!message.trim()) return;

    setInput('');

    // Add user message immediately
    const userMessage: Message = {
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Add thinking message
    const thinkingMessage: Message = {
      type: 'assistant',
      content: 'Analyzing parliamentary proceedings...',
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };

    // Update optimistic messages
    setOptimisticMessages([userMessage, thinkingMessage]);
    setIsThinking(true);
    setIsLoading(true);


    try {
      const response = await fetch(`${BACKEND}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          num_results: 4,
          conversation_id: currentConversation?.conversation_id
        }),
      });

      const data = await response.json();

      // Clear optimistic messages
      setOptimisticMessages([]);

      // If this was a new conversation, fetch all conversations
      if (!currentConversation?.conversation_id) {
        await fetchConversations();
      }

      // Load the current conversation with updated messages
      await loadConversation(data.conversation_id);

    } catch (error) {
      console.error('Error:', error);
      setOptimisticMessages([
        userMessage,
        {
          type: 'error',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  // Combine real and optimistic messages for display
  const displayMessages = currentConversation
    ? [...(currentConversation.messages || []), ...optimisticMessages]
    : optimisticMessages;

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
          <ChatContainer messages={displayMessages} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <MessageInput
          input={input}
          onInputChange={setInput}
          onSubmit={handleMessageSubmit}
          isLoading={isLoading}
          isThinking={isThinking}
        />
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
            handleQuestionSelect={(question: string) => {
              setInput(question);

              // Close right sidebar on mobile
              if (window.innerWidth < 768) {
                setRightSidebarOpen(false);
              }

              // Optional: Focus the input field
              const inputElement = document.querySelector('textarea');
              inputElement?.focus();
            }}
            followUpQuestions={getFollowUpQuestions()}
          />
        </div>
      </div>
    </div>
  );
};

export default App;