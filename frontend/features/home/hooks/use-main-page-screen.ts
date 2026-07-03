"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useHomeModel } from "@/features/home/model/use-home-model"

export function useMainPageScreen() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [dismissedUsernamePromptForUserId, setDismissedUsernamePromptForUserId] = useState<string | null>(null)
  const screen = useHomeModel()

  useEffect(() => {
    if (isAuthLoaded && !isSignedIn) {
      router.replace("/login")
    }
  }, [isAuthLoaded, isSignedIn, router])

  const shouldRenderPage = isAuthLoaded && isSignedIn
  const shouldShowUsernamePrompt =
    screen.profile.hasResolvedUser &&
    !screen.profile.user.haveUsername &&
    dismissedUsernamePromptForUserId !== screen.profile.user.clerkUserId

  return {
    screen,
    setDismissedUsernamePromptForUserId,
    shouldRenderPage,
    shouldShowUsernamePrompt,
  }
}
