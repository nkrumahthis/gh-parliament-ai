import { useRef, useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => Promise<void>;
  isLoading?: boolean;
}

const MessageInput = ({ 
  input, 
  onInputChange, 
  onSubmit, 
  isLoading = false 
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
    if (!input.trim()) return;

    try {
      await onSubmit(input);
    } catch (error) {
      console.error('Error submitting message:', error);
    }
  };

  return (
    <div 
      className="border-t border-gray-200 bg-white transition-all duration-200 ease-in-out"
      style={{ height: inputHeight }}
    >
      <form onSubmit={handleSubmit} className="h-full p-4">
        <div className="relative flex items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Ask about parliamentary proceedings..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden leading-normal pr-24"
            disabled={isLoading}
            rows={1}
            maxLength={1000}
            aria-label="Message input"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2 bg-white">
            {input.length > 0 && (
              <span className="text-xs text-gray-400">
                {input.length}/1000
              </span>
            )}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                input.trim() 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-300'
              }`}
              aria-label={isLoading ? "Sending..." : "Send message"}
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