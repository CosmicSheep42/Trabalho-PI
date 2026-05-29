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
  items: BackendListItem[]
  recipe_ids: number[]
}
