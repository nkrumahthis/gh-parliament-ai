import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Youtube, Clock, ArrowUpRight } from 'lucide-react';

interface Message {
  type: string;
  content: string;
  references?: Reference[];
}

interface Reference {
  video_url: string;
  timestamp: string;
  text: string;
}

const App = () => {

  const [messages, setMessages] = useState<Message[]>([]);
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

    const userMessage = { type: 'user', content: input };
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

      const assistantMessage = {
        type: 'assistant',
        content: data.answer,
        references: data.references
      };

      setMessages(prev => [...prev, assistantMessage]);
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
          <div className="font-bold text-xl">Video RAG</div>
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
            <button className="px-4 py-2 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
              Chat
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500">
              References
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white'} rounded-lg p-4 shadow`}>
                <div className="text-sm">{message.content}</div>

                {message.references && (
                  <div className="mt-4 space-y-2">
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
          ))}
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
          <div className="font-medium">Sample Questions</div>
          <button
            onClick={() => setInput("What are the main challenges discussed in the video?")}
            className="w-full text-left p-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
          >
            What are the main challenges discussed in the video?
          </button>
          <button
            onClick={() => setInput("Can you summarize the key points about AI's impact?")}
            className="w-full text-left p-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Can you summarize the key points about AI's impact?
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;