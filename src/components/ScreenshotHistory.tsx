import { useEffect, useState } from "react"

import {
  deleteQuestion,
  deleteScreenshot,
  getScreenshotQuestions,
  getScreenshots
} from "~utils/api"

interface Screenshot {
  _id: string
  imageUrl: string
  createdAt: string
}

interface Question {
  _id: string
  question: string
  answer: string
  createdAt: string
}

interface ScreenshotHistoryProps {
  onSelectScreenshot: (imageUrl: string, screenshotId: string) => void
  onClose: () => void
}

export const ScreenshotHistory = ({
  onSelectScreenshot,
  onClose
}: ScreenshotHistoryProps) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
    null
  )
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null
  )

  useEffect(() => {
    loadScreenshots()
  }, [])

  useEffect(() => {
    if (selectedScreenshot) {
      setQuestions([])
      loadQuestions(selectedScreenshot)
    }
  }, [selectedScreenshot])

  const loadScreenshots = async () => {
    try {
      setLoading(true)
      const data = await getScreenshots()
      setScreenshots(data)
      if (data.length > 0) {
        setSelectedScreenshot(data[0]._id)
      }
    } catch (error) {
      console.error("Error loading screenshots:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (screenshotId: string) => {
    try {
      setLoading(true)
      const data = await getScreenshotQuestions(screenshotId)
      setQuestions(data.questions)
    } catch (error) {
      console.error("Error loading questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteScreenshot = async (screenshotId: string) => {
    try {
      setDeletingId(screenshotId)
      await deleteScreenshot(screenshotId)

      // Remove the deleted screenshot from state
      setScreenshots((prev) => prev.filter((s) => s._id !== screenshotId))

      // If the deleted screenshot was selected, select another one
      if (selectedScreenshot === screenshotId) {
        const remainingScreenshots = screenshots.filter(
          (s) => s._id !== screenshotId
        )
        if (remainingScreenshots.length > 0) {
          setSelectedScreenshot(remainingScreenshots[0]._id)
        } else {
          setSelectedScreenshot(null)
          setQuestions([])
        }
      }
    } catch (error) {
      console.error("Error deleting screenshot:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      setDeletingQuestionId(questionId)
      await deleteQuestion(questionId)

      // Remove the deleted question from state
      setQuestions((prev) => prev.filter((q) => q._id !== questionId))
    } catch (error) {
      console.error("Error deleting question:", error)
    } finally {
      setDeletingQuestionId(null)
    }
  }

  const handleSelectScreenshot = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot._id)
    onSelectScreenshot(screenshot.imageUrl, screenshot._id)
  }

  if (loading && screenshots.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-purple-500/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-purple-500 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-100"></span>
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200"></span>
        </div>
      </div>
    )
  }

  if (screenshots.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-white font-medium">No screenshots found</p>
        <p className="text-gray-400 text-sm mt-2">
          Capture a screenshot to get started
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold text-white">Screenshot History</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors">
          Close
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 overflow-y-auto pr-1 custom-scrollbar max-h-[400px]">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot._id}
              className={`m-2 cursor-pointer rounded-lg transition-all ${
                selectedScreenshot === screenshot._id
                  ? "ring-1 ring-purple-500 bg-gray-800"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
              onClick={() => {
                setLoading(true)
                setSelectedScreenshot(screenshot._id)
              }}>
              <div className="p-2">
                <div className="relative group">
                  <img
                    src={screenshot.imageUrl}
                    alt="Screenshot thumbnail"
                    className="w-full h-auto rounded-md"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteScreenshot(screenshot._id)
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={deletingId === screenshot._id}>
                    {deletingId === screenshot._id ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(screenshot.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="w-2/3 overflow-y-auto p-4 custom-scrollbar max-h-[400px]">
          {selectedScreenshot && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  const screenshot = screenshots.find(
                    (s) => s._id === selectedScreenshot
                  )
                  if (screenshot) {
                    onSelectScreenshot(screenshot.imageUrl, screenshot._id)
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm py-1.5 px-3 rounded-full transition-colors">
                Open in Chat
              </button>
            </div>
          )}
          {loading && selectedScreenshot ? (
            <div className="flex justify-center items-center h-32 bg-gray-800/50 backdrop-blur-sm rounded-lg">
              <div className="w-10 h-10 border-4 border-t-purple-500 border-r-cyan-400 border-b-purple-500 border-l-cyan-400 rounded-full animate-spin"></div>
            </div>
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div
                key={q._id}
                className="mb-6 rounded-lg bg-gray-800 p-4 relative group/question">
                <button
                  onClick={() => handleDeleteQuestion(q._id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover/question:opacity-100 transition-opacity"
                  disabled={deletingQuestionId === q._id}>
                  {deletingQuestionId === q._id ? (
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
                <div className="flex items-start mb-2">
                  <div className="bg-gray-700 rounded-full p-1 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-purple-400"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="font-medium text-white">{q.question}</p>
                </div>
                <div className="flex items-start ml-7">
                  <div className="bg-gray-700 rounded-full p-1 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-gray-300 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {q.answer}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-right">
                  {new Date(q.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-32 bg-gray-800 rounded-lg p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-600 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-center text-gray-400">
                No questions for this screenshot
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
