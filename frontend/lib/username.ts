const USERNAME_PATTERN = /^[A-Za-z0-9_-]{5,50}$/

export const USERNAME_VALIDATION_MESSAGE =
  "Use 5 to 50 characters with only letters, numbers, hyphens, or underscores."

export function normalizeUsername(value: string) {
  return value.trim()
}

export function validateUsername(value: string) {
  const normalized = normalizeUsername(value)
  if (!USERNAME_PATTERN.test(normalized)) {
    return USERNAME_VALIDATION_MESSAGE
  }

  return null
}
