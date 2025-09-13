interface Message {
  sender: "ai" | "user"
  text: string
}

interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
}

export const ChatMessages = ({ messages, loading }: ChatMessagesProps) => (
  <div className="space-y-4">
    {messages.map((msg, idx) => (
      <div
        key={idx}
        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] px-4 py-2.5 text-sm
            ${
              msg.sender === "user"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl rounded-br-sm"
                : "bg-gray-800 text-white rounded-xl rounded-bl-sm"
            }`}>
          {msg.text}
        </div>
      </div>
    ))}

    {loading && (
      <div className="flex items-center space-x-2 px-4 py-2 w-16 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm">
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
        <div
          className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    )}
  </div>
)
