import { useState } from "react"

export const useDrawing = () => {
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = async () => {
    try {
      console.log("useDrawing | Starting drawing mode")

      // Get current active tab using activeTab permission
      const queryOptions = { active: true, currentWindow: true }
      const tabs = await chrome.tabs.query(queryOptions)
      const tab = tabs[0]
      
      if (!tab || !tab.id) {
        console.error("useDrawing | No active tab found")
        return
      }
      
      try {
        // Send message to content script
        await chrome.tabs.sendMessage(tab.id, { action: "start-drawing" })
        setIsDrawing(true)
        window.close()
      } catch (error) {
        console.log("useDrawing | Content script not found, injecting script")
        
        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["/contents/draw.js"]
        })
        
        // Wait a bit for the script to initialize then send message
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: "start-drawing" })
            setIsDrawing(true)
            window.close()
          } catch (err) {
            console.error("useDrawing | Failed to start drawing after script injection:", err)
          }
        }, 100)
      }
    } catch (error) {
      console.error("useDrawing | Drawing initialization failed:", error)
      setIsDrawing(false)
    }
  }

  return { isDrawing, setIsDrawing, startDrawing }
}
