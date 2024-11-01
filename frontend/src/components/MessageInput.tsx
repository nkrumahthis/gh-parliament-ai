import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => Promise<void>;
  isLoading?: boolean;
  isThinking?: boolean;
}

const MessageInput = ({ 
  input, 
  onInputChange, 
  onSubmit, 
  isLoading = false,
  isThinking = false
}: MessageInputProps) => {
  const [inputHeight, setInputHeight] = useState('auto');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 120);
      textarea.style.height = `${newHeight}px`;
      setInputHeight(`${newHeight + 32}px`);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    await onSubmit(input);
  };

  const getPlaceholder = () => {
    if (isThinking) return "Please wait while I process your last question...";
    return "Ask about parliamentary proceedings...";
  };

  return (
    <div 
      className="border-t border-gray-200 bg-white transition-all duration-200 ease-in-out"
      style={{ height: inputHeight }}
    >
      <form onSubmit={handleSubmit} className="h-full flex items-end p-4">
        <div className="flex-1 relative flex">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isThinking) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder={getPlaceholder()}
            className={`
              w-full px-4 py-3 rounded-lg border 
              resize-none overflow-hidden leading-normal
              transition-colors duration-200
              ${isThinking 
                ? 'bg-gray-50 border-gray-200 text-gray-500' 
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }
            `}
            disabled={isThinking}
            rows={1}
            aria-label="Message input"
          />
          <div className=" flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !input.trim() || isThinking}
              className={`
                p-2 rounded-full transition-all duration-200
                ${isThinking
                  ? 'text-gray-300 cursor-not-allowed'
                  : input.trim() 
                    ? 'text-blue-600 hover:bg-blue-50' 
                    : 'text-gray-300'
                }
              `}
              aria-label={
                isThinking 
                  ? "AI is thinking" 
                  : isLoading 
                    ? "Sending message" 
                    : "Send message"
              }
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;