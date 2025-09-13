import { Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { AuthButton } from "./AuthButton"
import { ParticleBackground } from "./ParticleBackground"

interface AuthScreenProps {
  onAuthChange: (isAuth: boolean) => void
}

export const AuthScreen = ({ onAuthChange }: AuthScreenProps) => (
  <div className="w-[400px] h-[600px] bg-black text-white overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a2e]/95 to-[#1a1a2e]/90 backdrop-blur-xl">
      <ParticleBackground />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-center items-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center gap-6 p-8">
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AskShot
          </span>
        </motion.div>
        <div className="text-center mb-2">
          <p className="text-gray-300 mb-6">Please login to continue</p>
          <AuthButton onAuthChange={onAuthChange} />
        </div>
      </motion.div>
    </div>
  </div>
)
