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
  egg_free: boolean
  gluten_free: boolean
  nut_free: boolean
  shellfish_free: boolean
  soy_free: boolean
  sesame_free: boolean
  sulfite_free: boolean
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
          egg_free: backendUser.egg_free,
          gluten_free: backendUser.gluten_free,
          nut_free: backendUser.nut_free,
          shellfish_free: backendUser.shellfish_free,
          soy_free: backendUser.soy_free,
          sesame_free: backendUser.sesame_free,
          sulfite_free: backendUser.sulfite_free,
        })
      : [],
  }
}

export function buildAllergyPayload(options: DietaryOption[]): Record<AllergyField, boolean> {
  return mapDietaryOptionsToAllergyPayload(options)
}
