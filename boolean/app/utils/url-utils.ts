// webrend/app/utils/url-utils.ts

// Hostnames allowed by next.config.js images.domains
const ALLOWED_IMAGE_HOSTNAMES = new Set([
  'avatars.githubusercontent.com',
  'github.com',
  'raw.githubusercontent.com',
  'user-images.githubusercontent.com',
  'placehold.co',
  'images.unsplash.com'
  // Add any other hostnames from your next.config.ts here
]);

/**
 * Checks if a given URL string is valid and its hostname is in the allowed list.
 * @param urlString The URL to check.
 * @returns True if the URL is valid and the hostname is allowed, false otherwise.
 */
export function isValidImageUrl(urlString: string | null | undefined): boolean {
  if (!urlString) {
    return false;
  }
  try {
    const url = new URL(urlString);
    return ALLOWED_IMAGE_HOSTNAMES.has(url.hostname);
  } catch (error) {
    // Invalid URL format
    console.warn(`Invalid URL format encountered: ${urlString}`, error);
    return false;
  }
} 