interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export const ChatInput = ({
  input,
  onInputChange,
  onSend,
  disabled = false
}: ChatInputProps) => (
  <div className="w-full">
    <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <input
          className="w-full bg-gray-800 text-white rounded-full px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 transition-all border-none"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && input.trim() && onSend()}
          placeholder="Ask about your screenshot..."
          disabled={disabled}
        />
      </div>
      <button
        onClick={onSend}
        disabled={!input.trim() || disabled}
        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13"></path>
          <path d="M22 2L15 22L11 13L2 9L22 2z"></path>
        </svg>
      </button>
    </div>
  </div>
)
