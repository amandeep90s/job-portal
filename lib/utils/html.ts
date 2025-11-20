/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped HTML string
 */
export const escapeHtml = (text: string): string => {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
};

/**
 * Removes HTML tags from a string
 * @param html - The HTML string to strip
 * @returns The plain text without HTML tags
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Encodes a string for use in URLs
 * @param text - The text to encode
 * @returns The URL-encoded string
 */
export const encodeForUrl = (text: string): string => {
  return encodeURIComponent(text);
};

/**
 * Decodes a URL-encoded string
 * @param encoded - The encoded string
 * @returns The decoded string
 */
export const decodeFromUrl = (encoded: string): string => {
  return decodeURIComponent(encoded);
};
