import { useEffect, useState } from "react"

export const useScreenshot = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get(["screenshot"], (result) => {
      if (result.screenshot) setScreenshot(result.screenshot)
    })

    const listener = (message: any) => {
      if (message.action === "screenshot-captured" && message.dataUrl) {
        console.log("useScreenshot | Screenshot received")
        setScreenshot(message.dataUrl)
        
        // Save the screenshot to storage
        chrome.storage.local.set({ screenshot: message.dataUrl }, () => {
          console.log("useScreenshot | Screenshot saved to storage")
        })
        
        // When a new screenshot is captured, remove any previous screenshot ID
        // so we don't associate the new screenshot with old conversations
        chrome.storage.local.remove(["screenshotId"], () => {
          console.log("useScreenshot | Removed old screenshot ID from storage")
        })
        
        // Switch to chat view
        chrome.storage.local.set({ currentView: "chat" }, () => {
          console.log("useScreenshot | Switched to chat view")
        })
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  const clearScreenshot = () => {
    setScreenshot(null)
  }
  
  const saveScreenshot = (screenshotData: string) => {
    setScreenshot(screenshotData)
    chrome.storage.local.set({ screenshot: screenshotData }, () => {
      console.log("useScreenshot | Screenshot saved to storage")
    })
  }

  return { 
    screenshot, 
    setScreenshot: saveScreenshot, 
    clearScreenshot 
  }
}
