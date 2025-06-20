import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B'
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M'
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPrice(price: number): string {
  if (price < 0.01) {
    return `$${price.toFixed(6)}`
  }
  return `$${price.toFixed(2)}`
}

export function formatAddress(address: string, length = 4): string {
  if (!address) return ''
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

// URL Validation utilities
export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateWebsiteUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true } // Empty is allowed
  }

  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' }
    }
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { isValid: false, error: 'Invalid domain name' }
    }
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

export function validateTwitterUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true } // Empty is allowed
  }

  // Support both twitter.com and x.com
  const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})(?:\/)?$/
  
  if (!twitterRegex.test(url)) {
    return { 
      isValid: false, 
      error: 'Use format: https://twitter.com/username or https://x.com/username' 
    }
  }

  // Extract username and validate length
  const match = url.match(twitterRegex)
  const username = match?.[3]
  
  if (!username || username.length < 1 || username.length > 15) {
    return { isValid: false, error: 'Twitter username must be 1-15 characters' }
  }

  return { isValid: true }
}

export function validateTelegramUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true } // Empty is allowed
  }

  // Support both t.me and telegram.me
  const telegramRegex = /^https?:\/\/(www\.)?(t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})(?:\/)?$/
  
  if (!telegramRegex.test(url)) {
    return { 
      isValid: false, 
      error: 'Use format: https://t.me/username' 
    }
  }

  // Extract username and validate length
  const match = url.match(telegramRegex)
  const username = match?.[3]
  
  if (!username || username.length < 5 || username.length > 32) {
    return { isValid: false, error: 'Telegram username must be 5-32 characters' }
  }

  return { isValid: true }
}

export function validateSocialUrls(formData: { website?: string; twitter?: string; telegram?: string }) {
  const errors: Record<string, string> = {}
  
  const websiteResult = validateWebsiteUrl(formData.website || '')
  if (!websiteResult.isValid && websiteResult.error) {
    errors.website = websiteResult.error
  }
  
  const twitterResult = validateTwitterUrl(formData.twitter || '')
  if (!twitterResult.isValid && twitterResult.error) {
    errors.twitter = twitterResult.error
  }
  
  const telegramResult = validateTelegramUrl(formData.telegram || '')
  if (!telegramResult.isValid && telegramResult.error) {
    errors.telegram = telegramResult.error
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}