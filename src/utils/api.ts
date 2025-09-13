import axios from "axios"

const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || "https://askshot.xyz"

function ensureValidImageData(imageData: string): string {
  if (!imageData) throw new Error("No image data provided")

  if (imageData.startsWith("data:image/")) return imageData

  try {
    atob(imageData)
    return `data:image/png;base64,${imageData}`
  } catch (e) {
    console.error("AnalyzeScreenshot | Invalid base64:", e)
    throw new Error("Invalid image data format")
  }
}

export async function analyzeScreenshot(
  screenshot: string,
  question: string,
  screenshotId?: string
) {
  try {
    const validatedScreenshot = ensureValidImageData(screenshot)

    const payload: {
      screenshot: string
      question: string
      screenshotId?: string
    } = {
      screenshot: validatedScreenshot,
      question
    }

    // If a screenshotId is provided, include it in the request
    if (screenshotId) {
      payload.screenshotId = screenshotId
    }

    const response = await axios.post(`${API_BASE_URL}/api/analyze`, payload)

    return response.data
  } catch (error: any) {
    console.error("AnalyzeScreenshot | Error:", error)

    // Check if it's an overloaded error response from our API
    if (error.response?.data?.isOverloaded) {
      throw {
        isOverloaded: true,
        message:
          error.response.data.message ||
          "Service is experiencing high demand. Please try again later."
      }
    }

    throw error
  }
}

export async function getScreenshots() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/screenshots`)
    return response.data.screenshots
  } catch (error) {
    console.error("GetScreenshots | Error:", error)
    throw error
  }
}

export async function getScreenshotQuestions(screenshotId: string) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/screenshots/${screenshotId}`
    )
    return response.data
  } catch (error) {
    console.error("GetScreenshotQuestions | Error:", error)
    throw error
  }
}

export async function getUserCredits() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/credits`)
    return response.data
  } catch (error) {
    console.error("GetUserCredits | Error:", error)
    throw error
  }
}

export async function getUserTier() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/tier`)
    return response.data
  } catch (error) {
    console.error("GetUserTier | Error:", error)
    throw error
  }
}

export async function deleteScreenshot(screenshotId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/screenshots/${screenshotId}`)
    return response.data
  } catch (error) {
    console.error("DeleteScreenshot | Error:", error)
    throw error
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/questions/${questionId}`)
    return response.data
  } catch (error) {
    console.error("DeleteQuestion | Error:", error)
    throw error
  }
}
