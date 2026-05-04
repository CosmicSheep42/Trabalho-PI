import {
  mapAllergyFieldsToOptions,
  mapDietaryOptionsToAllergyPayload,
  type AllergyField,
  type DietaryOption,
} from "@/lib/dietary-options"

interface ClerkUserSnapshot {
  id?: string
  fullName?: string | null
  firstName?: string | null
  primaryEmailAddress?: {
    emailAddress: string
  } | null
  imageUrl?: string
}

export interface BackendUser {
  id: number
  clerk_user_id: string
  vegan: boolean
  vegetarian: boolean
  lactose_free: boolean
  gluten_free: boolean
  no_eggs: boolean
  nut_free: boolean
  low_carb: boolean
  high_protein: boolean
}

export interface ProfileUser {
  id: number | null
  clerkUserId: string
  name: string
  email: string
  avatar?: string
  allergies: DietaryOption[]
}

export function buildProfileUser(
  clerkUser: ClerkUserSnapshot | null | undefined,
  backendUser?: BackendUser | null
): ProfileUser {
  return {
    id: backendUser?.id ?? null,
    clerkUserId: backendUser?.clerk_user_id ?? clerkUser?.id ?? "",
    name: clerkUser?.fullName ?? clerkUser?.firstName ?? "User",
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? "",
    avatar: clerkUser?.imageUrl,
    allergies: backendUser
      ? mapAllergyFieldsToOptions({
          vegan: backendUser.vegan,
          vegetarian: backendUser.vegetarian,
          lactose_free: backendUser.lactose_free,
          gluten_free: backendUser.gluten_free,
          no_eggs: backendUser.no_eggs,
          nut_free: backendUser.nut_free,
          low_carb: backendUser.low_carb,
          high_protein: backendUser.high_protein,
        })
      : [],
  }
}

export function buildAllergyPayload(options: DietaryOption[]): Record<AllergyField, boolean> {
  return mapDietaryOptionsToAllergyPayload(options)
}
