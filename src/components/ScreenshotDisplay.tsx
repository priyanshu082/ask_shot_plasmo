interface ScreenshotDisplayProps {
  screenshot: string | null
  onClear: () => void
}

export const ScreenshotDisplay = ({
  screenshot,
  onClear
}: ScreenshotDisplayProps) => (
  <div className="relative overflow-hidden rounded-lg bg-gray-900/50 backdrop-blur-sm">
    {screenshot && (
      <button
        onClick={onClear}
        className="absolute top-3 right-3 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-200 z-10 backdrop-blur-sm"
        title="Clear screenshot">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    )}

    <div className="w-full h-52 flex items-center justify-center p-2">
      {screenshot ? (
        <img
          src={screenshot}
          alt="Screenshot"
          className="max-w-full max-h-full object-contain rounded-md shadow-lg"
          onError={(e) => {
            console.error("ScreenshotDisplay | Image failed to load")
            e.currentTarget.style.display = "none"
          }}
        />
      ) : (
        <div className="text-gray-400 text-center p-4">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-3 text-gray-500">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span className="text-sm">Take a screenshot to get started</span>
        </div>
      )}
    </div>
  </div>
)
