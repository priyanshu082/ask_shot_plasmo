export interface AuthSession {
  user?: {
    name?: string
    email?: string
    image?: string
  }
  accessToken?: string
  expires?: string
}

let currentSession: AuthSession | null = null
const authUrl = process.env.PLASMO_PUBLIC_BACKEND_URL || "https://askshot.xyz"
export const signIn = async (): Promise<AuthSession | null> => {
  return new Promise((resolve) => {
    const signInUrl = `${authUrl}/auth/signin?prompt=select_account&from=extension`
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const authWindow = window.open(
      signInUrl,
      "Auth",
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=1`
    )

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== authWindow) return
      if (event.data?.type === "AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage)
        const session = event.data.session as AuthSession
        storeSession(session)
        resolve(session)
      }
    }

    window.addEventListener("message", handleMessage)

    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed)
        window.removeEventListener("message", handleMessage)
        resolve(null)
      }
    }, 500)
  })
}

export const signOut = async (): Promise<void> => {
  currentSession = null
  await chrome.storage.local.remove([
    "auth_session",
    "screenshot",
    "screenshotId",
    "currentView"
  ])

  const width = 600
  const height = 700
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2

  const signOutUrl = `${authUrl}/api/auth/signout?callbackUrl=/auth/signin?prompt=select_account`

  const signOutWindow = window.open(
    signOutUrl,
    "SignOut",
    `width=${width},height=${height},left=${left},top=${top}`
  )

  if (!signOutWindow) return

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (signOutWindow.closed) {
        clearInterval(interval)
        resolve()
      }
    }, 500)
  })
}

export const storeSession = async (session: AuthSession): Promise<void> => {
  currentSession = session
  await chrome.storage.local.set({ auth_session: JSON.stringify(session) })
}

export const loadSession = async (): Promise<AuthSession | null> => {
  if (currentSession) return currentSession

  return new Promise((resolve) => {
    chrome.storage.local.get(["auth_session"], (result) => {
      if (result.auth_session) {
        try {
          const session = JSON.parse(result.auth_session) as AuthSession
          currentSession = session
          resolve(session)
        } catch (e) {
          console.error("AuthSession | Failed to parse stored session:", e)
          resolve(null)
        }
      } else {
        resolve(null)
      }
    })
  })
}

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await loadSession()
  return !!session
}

export const getCurrentUser = async () => {
  const session = await loadSession()
  return session?.user || null
}
