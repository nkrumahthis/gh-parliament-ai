import { FollowUpQuestion, Message } from "../types";
import ChatMessage from "./ChatMessage";
import Welcome from "./Welcome";

interface ChatContainerProps {
  messages: Message[];
  handleQuestionSelect: (question: string) => void;
  followUpQuestions: FollowUpQuestion[];
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  handleQuestionSelect,
  followUpQuestions
}) => {
  const isEmpty = messages.length === 0;

  return (
    <div className={`
            flex-1 overflow-hidden
            ${isEmpty ? 'bg-white' : 'overflow-y-auto p-4 space-y-4'}
        `}>
      {isEmpty ? (
        <Welcome
          handleQuestionSelect={handleQuestionSelect}
          followUpQuestions={followUpQuestions}
        />
      ) : (
        messages.map((message, index) => (
          <div key={index} className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
            <ChatMessage message={message} />
          </div>
        ))
      )}
    </div>
  );
};

export default ChatContainer;