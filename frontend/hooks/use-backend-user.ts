"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { buildAllergyPayload, buildProfileUser, type BackendUser } from "@/features/profile/types"
import type { DietaryOption } from "@/lib/dietary-options"

export function useBackendUser() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser()

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isSavingUser, setIsSavingUser] = useState(false)

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded || !isSignedIn) {
      setBackendUser(null)
      setIsLoadingUser(false)
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
          setIsLoadingUser(false)
        }
      }
    }

    void loadUser()

    return () => {
      isCancelled = true
    }
  }, [getToken, isAuthLoaded, isSignedIn, isUserLoaded])

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

  return {
    user: buildProfileUser(clerkUser, backendUser),
    isLoadingUser,
    isSavingUser,
    saveUserAllergies,
  }
}
