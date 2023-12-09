// Encode text to Base64
export function textToBase64(text: string) {
  return btoa(encodeURIComponent(text))
}

// Decode Base64 to text
export function base64ToText(base64: string) {
  return decodeURIComponent(atob(base64))
}
