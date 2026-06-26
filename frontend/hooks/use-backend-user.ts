"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api"
import { buildAllergyPayload, buildProfileUser, type BackendUser } from "@/features/profile/types"
import type { DietaryOption } from "@/lib/dietary-options"

export function useBackendUser() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser()

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [resolvedClerkUserId, setResolvedClerkUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    async function loadUser() {
      setIsLoadingUser(true)

      try {
        const token = await getToken()
        if (!token) {
          throw new Error("Missing Clerk session token")
        }

        const nextUser = await apiRequest<BackendUser>("/api/auth/me", {
          method: "GET",
          token,
        })

        if (!isCancelled) {
          setBackendUser(nextUser)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load backend user", error)
        }
      } finally {
        if (!isCancelled) {
          setResolvedClerkUserId(clerkUser?.id ?? null)
          setIsLoadingUser(false)
        }
      }
    }

    void loadUser()

    return () => {
      isCancelled = true
    }
  }, [clerkUser?.id, getToken, isAuthLoaded, isSignedIn, isUserLoaded])

  async function saveUserAllergies(allergies: DietaryOption[]) {
    setIsSavingUser(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Missing Clerk session token")
      }

      const nextUser = await apiRequest<BackendUser>("/api/auth/me/allergies", {
        method: "PUT",
        token,
        body: JSON.stringify(buildAllergyPayload(allergies)),
      })

      setBackendUser(nextUser)
    } finally {
      setIsSavingUser(false)
    }
  }

  const profileUser = useMemo(
    () => buildProfileUser(isSignedIn ? clerkUser : null, isSignedIn ? backendUser : null),
    [backendUser, clerkUser, isSignedIn]
  )

  return {
    user: profileUser,
    isLoadingUser,
    hasResolvedUser:
      isAuthLoaded && isUserLoaded && (!isSignedIn || resolvedClerkUserId === (clerkUser?.id ?? null)),
    isSavingUser,
    saveUserAllergies,
  }
}
