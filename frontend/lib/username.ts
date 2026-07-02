const USERNAME_PATTERN = /^[A-Za-z0-9_-]{5,50}$/

export const USERNAME_VALIDATION_MESSAGE =
  "Please enter a valid username."

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
