import { Edit2 } from "lucide-react"

import { AuthButton } from "./AuthButton"

interface ChatHeaderProps {
  screenshot: string | null
  onStartDrawing: () => void
  onAuthChange: (isAuth: boolean) => void
}

export const ChatHeader = ({
  screenshot,
  onStartDrawing,
  onAuthChange
}: ChatHeaderProps) => (
  <div className="p-3 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border-b border-white/20">
    <div className="flex items-center gap-2">
      <button
        onClick={onStartDrawing}
        className="relative p-2.5 rounded-xl text-white overflow-hidden transition-all hover:shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-transform group-hover:scale-[1.1] duration-300" />
        <Edit2 size={18} className="relative" />
      </button>

      <div className="flex-1">
        <span
          className={`text-sm font-medium ${
            screenshot
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent"
              : "text-gray-500/70"
          }`}>
          {screenshot ? "Screenshot ready" : "Click pencil to capture screen"}
        </span>
      </div>

      <AuthButton onAuthChange={onAuthChange} />
    </div>
  </div>
)
