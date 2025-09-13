chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture-screenshot") {
    // Using activeTab permission instead of tabs
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      console.log("captureScreenshot | Screenshot captured successfully")
      sendResponse?.({ success: true, data: dataUrl })
    })
    return true
  }

  if (message.action === "store-cropped-screenshot" && message.data) {
    chrome.storage.local.set({ screenshot: message.data }, () => {
      chrome.runtime.sendMessage({
        action: "screenshot-captured",
        data: message.data
      })
      console.log("storeCroppedScreenshot | Screenshot stored and broadcasted")
    })
  }
})
