"use client"

import { MainPageContent } from "@/features/home/components/main-page-content"
import { MainPageDialogs } from "@/features/home/components/main-page-dialogs"
import { MainPageHeader } from "@/features/home/components/main-page-header"
import { useMainPageScreen } from "@/features/home/hooks/use-main-page-screen"

export default function MainPage() {
  const { screen, setDismissedUsernamePromptForUserId, shouldRenderPage, shouldShowUsernamePrompt } =
    useMainPageScreen()

  if (!shouldRenderPage) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <MainPageHeader screen={screen} />

      <MainPageContent screen={screen} />

      <MainPageDialogs
        screen={screen}
        usernamePrompt={{
          open: shouldShowUsernamePrompt,
          onSkip: () => setDismissedUsernamePromptForUserId(screen.profile.user.clerkUserId),
        }}
      />
    </div>
  )
}
