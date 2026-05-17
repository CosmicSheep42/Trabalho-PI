export const dietaryBadgeConfig = {
  vegan: {
    label: "Vegan",
    className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
  },
  vegetarian: {
    label: "Vegetarian",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800",
  },
  "lactose-free": {
    label: "Lactose Free",
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
  },
  "egg-free": {
    label: "Egg Free",
    className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800",
  },
  "gluten-free": {
    label: "Gluten Free",
    className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800",
  },
  "nut-free": {
    label: "Nut Free",
    className: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800",
  },
  "shellfish-free": {
    label: "Shellfish Free",
    className: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-400 dark:border-violet-800",
  },
  "soy-free": {
    label: "Soy Free",
    className: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/50 dark:text-cyan-400 dark:border-cyan-800",
  },
  "sesame-free": {
    label: "Sesame Free",
    className: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-900/50 dark:text-fuchsia-400 dark:border-fuchsia-800",
  },
  "sulfite-free": {
    label: "Sulfite Free",
    className: "bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-900/50 dark:text-lime-400 dark:border-lime-800",
  },
} as const

export type DietaryOption = keyof typeof dietaryBadgeConfig
export const dietaryOptions = Object.keys(dietaryBadgeConfig) as DietaryOption[]

export const allergyFieldToDietaryOption = {
  vegan: "vegan",
  vegetarian: "vegetarian",
  lactose_free: "lactose-free",
  egg_free: "egg-free",
  gluten_free: "gluten-free",
  nut_free: "nut-free",
  shellfish_free: "shellfish-free",
  soy_free: "soy-free",
  sesame_free: "sesame-free",
  sulfite_free: "sulfite-free",
} as const

export type AllergyField = keyof typeof allergyFieldToDietaryOption

const dietaryOptionToAllergyField = Object.fromEntries(
  Object.entries(allergyFieldToDietaryOption).map(([field, option]) => [option, field])
) as Record<DietaryOption, AllergyField>

export function mapAllergyFieldsToOptions(
  allergies: Record<AllergyField, boolean>
): DietaryOption[] {
  return (Object.entries(allergies) as [AllergyField, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([field]) => allergyFieldToDietaryOption[field])
}

export function mapDietaryOptionsToAllergyPayload(options: DietaryOption[]) {
  return (Object.keys(allergyFieldToDietaryOption) as AllergyField[]).reduce(
    (payload, field) => {
      payload[field] = options.includes(allergyFieldToDietaryOption[field])
      return payload
    },
    {} as Record<AllergyField, boolean>
  )
}

export function mapDietaryOptionToAllergyField(option: DietaryOption): AllergyField {
  return dietaryOptionToAllergyField[option]
}
