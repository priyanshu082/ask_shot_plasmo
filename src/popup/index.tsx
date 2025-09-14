import axios from "axios"
import {
  Camera,
  History,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
  Zap
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

import {
  analyzeScreenshot,
  getScreenshotQuestions,
  getUserCredits,
  getUserTier
} from "../utils/api"
import { signOut } from "../utils/auth"

import "../styles/global.css"

import {
  AuthScreen,
  ChatInput,
  ChatMessages,
  ScreenshotDisplay,
  ScreenshotHistory
} from "../components"
import { useDrawing, useScreenshot } from "../hooks"

interface Message {
  sender: "ai" | "user"
  text: string
  id?: string
  timestamp?: Date
}

interface ScreenshotData {
  id?: string
  dataUrl: string
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 600

    // Initialize particles
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "rgba(139, 92, 246, 0.1)"
      ctx.lineWidth = 0.5
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw particles
      particlesRef.current.forEach((particle) => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        )
        gradient.addColorStop(0, `rgba(139, 92, 246, ${particle.opacity})`)
        gradient.addColorStop(1, `rgba(6, 182, 212, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  )
}

const IndexPopup = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hi! Ask me anything about the image.",
      id: "1",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [screenshotData, setScreenshotData] = useState<ScreenshotData | null>(
    null
  )

  const [freeTrialsLeft, setFreeTrialsLeft] = useState<number>(5)
  const [isTrialExpired, setIsTrialExpired] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [currentView, setCurrentView] = useState<
    "capture" | "chat" | "history"
  >("capture")
  const [showDropdown, setShowDropdown] = useState(false)
  const [userTier, setUserTier] = useState<"free" | "paid">("free")

  const { screenshot, clearScreenshot, setScreenshot } = useScreenshot()
  const { startDrawing } = useDrawing()

  // Load screenshot and conversation history from storage when component mounts
  useEffect(() => {
    chrome.storage.local.get(
      ["screenshot", "screenshotId", "currentView"],
      (result) => {
        if (result.screenshot) {
          setScreenshot(result.screenshot)

          if (result.screenshotId) {
            setScreenshotData({
              id: result.screenshotId,
              dataUrl: result.screenshot
            })

            // Load conversation history for this screenshot
            loadConversationHistory(result.screenshotId)
          }

          // Switch to chat view if we have a screenshot
          setCurrentView("chat")
        }

        // Set current view from storage if available
        if (result.currentView) {
          setCurrentView(result.currentView)
        }
      }
    )
  }, [])

  // Load user credits when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserCredits()
    }
  }, [isAuthenticated])

  const loadUserCredits = async () => {
    try {
      const creditsData = await getUserCredits()
      setFreeTrialsLeft(creditsData.freeTrialsLeft)
      setIsTrialExpired(creditsData.isExpired)

      try {
        const tierData = await getUserTier()
        if (tierData.tier) {
          setUserTier(tierData.tier)
        }
      } catch (tierError) {
        console.error("Error loading user tier:", tierError)
      }
    } catch (error) {
      console.error("Error loading user credits:", error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !screenshot || isTrialExpired) return

    const userQuestion = input.trim()
    const userMsgId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userQuestion,
        id: userMsgId,
        timestamp: new Date()
      }
    ])
    setInput("")
    setLoading(true)

    try {
      // Pass the screenshot ID if available
      const response = await analyzeScreenshot(
        screenshot,
        userQuestion,
        screenshotData?.id
      )
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: response.answer,
          id: (Date.now() + 1).toString(),
          timestamp: new Date()
        }
      ])

      // Update free trials left from API response
      if (response.freeTrialsLeft !== undefined) {
        setFreeTrialsLeft(response.freeTrialsLeft)
        setIsTrialExpired(response.isExpired || response.freeTrialsLeft <= 0)
      }

      // Store the screenshotId if it's the first question for this screenshot
      if (response.screenshotId && (!screenshotData || !screenshotData.id)) {
        const newScreenshotData = {
          id: response.screenshotId,
          dataUrl: screenshot
        }
        setScreenshotData(newScreenshotData)

        // Save screenshot ID to storage for persistence
        chrome.storage.local.set(
          {
            screenshot: screenshot,
            screenshotId: response.screenshotId
          },
          () => {
            console.log("IndexPopup | Screenshot ID saved to storage")
          }
        )
      } else if (screenshotData && screenshotData.id) {
        // If we already have a screenshot ID, we don't need to do anything special
        // The API will associate the question with the existing screenshot
        // The next time this screenshot is loaded, the conversation history will include this question
        console.log(
          "IndexPopup | Using existing screenshot ID:",
          screenshotData.id
        )
      }
    } catch (error) {
      console.error("IndexPopup | Error getting AI response:", error)

      // Check if the error is due to expired credits
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response?.data?.error === "No credits left"
      ) {
        setFreeTrialsLeft(0)
        setIsTrialExpired(true)
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "You've used all your free credits. Please upgrade to continue using AskShot.",
            id: Date.now().toString(),
            timestamp: new Date()
          }
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Sorry, I couldn't analyze that screenshot. Please try again.",
            id: Date.now().toString(),
            timestamp: new Date()
          }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAuthChange = (isAuth: boolean) => {
    setIsAuthenticated(isAuth)
    console.log("IndexPopup | Authentication status changed:", isAuth)

    if (isAuth) {
      loadUserCredits()
    }
  }

  const handleClearScreenshot = () => {
    clearScreenshot()
    setScreenshotData(null)
    setMessages([
      {
        sender: "ai",
        text: "Hi! Ask me anything about the image.",
        id: Date.now().toString(),
        timestamp: new Date()
      }
    ])

    setCurrentView("capture")

    // Clear screenshot data from storage
    chrome.storage.local.remove(["screenshot", "screenshotId"], () => {
      console.log("IndexPopup | Screenshot data cleared from storage")
    })
  }

  const handleSelectFromHistory = (imageUrl: string, screenshotId: string) => {
    setScreenshot(imageUrl)

    setScreenshotData({
      id: screenshotId,
      dataUrl: imageUrl
    })

    // Load conversation history for this screenshot
    loadConversationHistory(screenshotId)

    // Change view to chat
    setCurrentView("chat")
  }

  const loadConversationHistory = async (screenshotId: string) => {
    try {
      setLoading(true)
      const data = await getScreenshotQuestions(screenshotId)

      if (data.questions && data.questions.length > 0) {
        // Convert questions and answers to message format
        const conversationMessages: Message[] = []

        // Add initial AI greeting
        conversationMessages.push({
          sender: "ai",
          text: "Hi! Ask me anything about this image from your history.",
          id: "greeting-" + Date.now(),
          timestamp: new Date()
        })

        // Add all questions and answers in chronological order
        data.questions.forEach((q, index) => {
          const baseTime = Date.now() - (data.questions.length - index) * 60000

          conversationMessages.push({
            sender: "user",
            text: q.question,
            id: "hist-q-" + index + "-" + baseTime,
            timestamp: new Date(baseTime)
          })

          conversationMessages.push({
            sender: "ai",
            text: q.answer,
            id: "hist-a-" + index + "-" + (baseTime + 1000),
            timestamp: new Date(baseTime + 1000)
          })
        })

        setMessages(conversationMessages)
      } else {
        // No conversation history, set default greeting
        setMessages([
          {
            sender: "ai",
            text: "Hi! Ask me anything about this image from your history.",
            id: "greeting-" + Date.now(),
            timestamp: new Date()
          }
        ])
      }
    } catch (error) {
      console.error("Error loading conversation history:", error)
      setMessages([
        {
          sender: "ai",
          text: "Hi! Ask me anything about this image from your history."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Simple transition for animations
  const springTransition = {
    duration: 0.5
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthChange={handleAuthChange} />
  }

  return (
    <div className="w-[400px] h-[600px] bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a2e]/95 to-[#1a1a2e]/90 backdrop-blur-xl">
        <ParticleBackground />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-50 p-4 bg-black/80 backdrop-blur-md border-b border-[#333]/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  AskShot
                </span>
              </motion.div>
              {userTier === "paid" ? (
                <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-medium">
                    Pro
                  </span>
                </div>
              ) : freeTrialsLeft <= 3 ? (
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-xs px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                  <span className="text-red-400 font-medium">
                    {freeTrialsLeft === 0
                      ? "No credits left"
                      : `${freeTrialsLeft} credits left`}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full hover:bg-[#1a1a2e]/80 relative overflow-hidden group">
                <motion.div
                  initial={false}
                  animate={{ rotate: isDark ? 0 : 180 }}
                  transition={{ duration: 0.5 }}>
                  {isDark ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-full hover:bg-[#1a1a2e]/80 relative">
                  <div className="w-6 h-6 bg-[#1a1a2e]/80 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  {isAuthenticated && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a2e]/95 backdrop-blur-md border border-[#333]/50 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <a
                          href={`${process.env.PLASMO_PUBLIC_BACKEND_URL}/#pricing`}
                          target="_blank"
                          onClick={() => setShowDropdown(false)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#1a1a2e]/80 flex items-center gap-2 mb-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
                          <span className="h-4 w-4 flex items-center justify-center text-cyan-400 font-bold">
                            ⭐
                          </span>
                          Upgrade
                        </a>

                        <button
                          onClick={async () => {
                            setShowDropdown(false)
                            setIsAuthenticated(false)
                            await signOut()
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#1a1a2e]/80 flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="px-4 py-2">
          <div className="flex gap-1 bg-[#1a1a2e]/50 backdrop-blur-sm rounded-lg p-1 border border-[#333]/30">
            {[
              { key: "capture", icon: Camera, label: "Capture" },
              { key: "chat", icon: MessageCircle, label: "Chat" },
              { key: "history", icon: History, label: "History" }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md relative overflow-hidden ${
                  currentView === key
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg"
                    : "hover:bg-[#1a1a2e]/80"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {currentView === key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-md"
                    transition={{ duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-4 overflow-hidden h-[calc(100%-130px)]">
          <AnimatePresence mode="wait">
            {currentView === "capture" && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col justify-center">
                <div className="p-6 text-center">
                  <motion.div
                    className="mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}>
                    <div className="w-16 h-16 mx-auto bg-[#1a1a2e]/80 rounded-full flex items-center justify-center border border-purple-500/30 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          y: [0, -2, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}>
                        <Camera className="w-8 h-8 text-purple-400" />
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}>
                    <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Capture & Analyze
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm">
                      Draw on your screen to get AI-powered insights
                    </p>
                  </motion.div>

                  <motion.div
                    className="space-y-3"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}>
                    <button
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/20 relative overflow-hidden group"
                      onClick={startDrawing}>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Zap className="w-4 h-4" />
                      Draw & Analyze
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {currentView === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col overflow-hidden">
                {screenshot ? (
                  <>
                    <motion.div
                      className="relative"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}>
                      <ScreenshotDisplay
                        screenshot={screenshot}
                        onClear={handleClearScreenshot}
                      />
                    </motion.div>

                    <motion.div
                      className="flex-1 overflow-y-auto p-4 space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}>
                      <ChatMessages messages={messages} loading={loading} />
                    </motion.div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      className="text-center p-8"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}>
                      <div className="w-16 h-16 mx-auto bg-[#1a1a2e]/80 rounded-full flex items-center justify-center mb-4 border border-[#333]/50">
                        <Camera className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-medium bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        No Screenshot
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Capture a screenshot first to start a chat
                      </p>
                      <button
                        onClick={() => setCurrentView("capture")}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        Go to Capture
                      </button>
                    </motion.div>
                  </div>
                )}

                {screenshot && (
                  <motion.div
                    className="p-4 pt-0"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}>
                    <div className="relative bg-[#1a1a2e]/50 rounded-lg border border-[#333]/50 overflow-hidden">
                      <ChatInput
                        input={input}
                        onInputChange={setInput}
                        onSend={handleSend}
                        disabled={isTrialExpired}
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-500/5 to-cyan-500/5" />
                    </div>
                  </motion.div>
                )}

                {/* Credits display */}
                {isTrialExpired && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center px-4 py-2 bg-red-900/20 border-t border-red-900/30">
                    Your free credits have expired.{" "}
                    <a
                      href={`${process.env.PLASMO_PUBLIC_BACKEND_URL}/#pricing`}
                      target="_blank"
                      className="font-medium ml-1 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500 hover:from-red-500 hover:to-purple-600 transition-colors underline underline-offset-2">
                      Upgrade to continue
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentView === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full overflow-hidden">
                <div className="bg-[#1a1a2e]/50 backdrop-blur-sm rounded-lg border border-[#333]/50 h-full">
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}>
                    <ScreenshotHistory
                      onSelectScreenshot={handleSelectFromHistory}
                      onClose={() => setCurrentView("capture")}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
