import type { ListItem } from "@/features/lists/types"
import type { ShopList } from "@/components/shoplist-banner"

export const mockLists: ShopList[] = [
  { id: "1", name: "Weekly Groceries", color: "green", itemCount: 8, linkedRecipeIds: ["1", "5"] },
  { id: "2", name: "Party Supplies", color: "purple", itemCount: 5, linkedRecipeIds: [] },
  { id: "3", name: "Quick Dinner", color: "orange", itemCount: 3, linkedRecipeIds: ["3"] },
]

export const mockListItems: Record<string, ListItem[]> = {
  "1": [
    { id: "1", name: "Milk", amount: "1 gallon", checked: false },
    { id: "2", name: "Bread", amount: "1 loaf", checked: true },
    { id: "3", name: "Eggs", amount: "1 dozen", checked: false },
    { id: "4", name: "Butter", amount: "1 pack", checked: false },
    { id: "5", name: "Cheese", amount: "8 oz", checked: true },
    { id: "6", name: "Apples", amount: "6", checked: false },
    { id: "7", name: "Chicken breast", amount: "2 lbs", checked: false },
    { id: "8", name: "Rice", amount: "2 lbs", checked: false },
  ],
  "2": [
    { id: "1", name: "Chips", amount: "3 bags", checked: false },
    { id: "2", name: "Soda", amount: "2 liters", checked: false },
    { id: "3", name: "Napkins", amount: "1 pack", checked: false },
    { id: "4", name: "Cups", amount: "50 ct", checked: false },
    { id: "5", name: "Ice", amount: "2 bags", checked: false },
  ],
  "3": [
    { id: "1", name: "Pasta", amount: "1 box", checked: false },
    { id: "2", name: "Marinara sauce", amount: "1 jar", checked: false },
    { id: "3", name: "Parmesan", amount: "4 oz", checked: false },
  ],
}
