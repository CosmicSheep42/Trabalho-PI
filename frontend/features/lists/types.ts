export interface ListItem {
  id: string
  text: string
  amount: string
  checked: boolean
}

export interface BackendListItem {
  id: number
  list_id: number
  name: string
  quantity: number | null
  unit: string | null
  checked: boolean
}

export interface BackendList {
  id: number
  name: string
  color: string
  date: string | null
  owner: BackendListUser
  collaborators: BackendListUser[]
  items: BackendListItem[]
  recipe_ids: number[]
  list_recipes: BackendListRecipe[]
}

export interface BackendListUser {
  id: number
  username: string
  clerk_user_id: string
  avatar?: string | null
}

export interface BackendListRecipe {
  recipe_id: number
  servings: number | null
}

export interface ListRecipeLink {
  recipeId: string
  servings: number | null
}

export interface ListMemberUser {
  id: string
  username: string
  clerkUserId: string
  avatar?: string | null
}
