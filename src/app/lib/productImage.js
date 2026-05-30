/**
 * Image URLs use same-origin paths (/uploads/...) so no backend URL is exposed.
 * Next.js rewrites proxy /uploads/* to the backend.
 */

/**
 * Get display URL for a product image from API data.
 * Relative paths (e.g. /uploads/...) are used as-is (same origin).
 * @param {Object} product - Product object with optional images[{ downloadUrl }]
 * @param {string} [fallback] - Placeholder image path when product has no image
 * @returns {string} Image URL or fallback
 */
export function getProductImageUrl(product, fallback = "\assets\Banner\jennie-vasline.jpg") {
  const downloadUrl = product?.images?.[0]?.downloadUrl;
  if (!downloadUrl) return fallback;
  if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
    return downloadUrl;
  }
  return downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;
}

/**
 * Get display URL from a raw downloadUrl (e.g. from cart item product).
 * @param {string} downloadUrl - downloadUrl from product.images[0]
 * @param {string} [fallback]
 * @returns {string}
 */
export function getImageUrlFromDownloadUrl(downloadUrl, fallback = "/assets/third_image.png") {
  if (!downloadUrl) return fallback;
  if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
    return downloadUrl;
  }
  return downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;
}

/**
 * Get display URL from a single image object inside product.images[].
 * Use this when mapping over product.images to show gallery or a specific image.
 * @param {{ downloadUrl?: string, fileName?: string }} imageItem - item from product.images array
 * @param {string} [fallback]
 * @returns {string}
 */
export function getProductImageUrlFromItem(imageItem, fallback = "/assets/third_image.png") {
  const downloadUrl = imageItem?.downloadUrl;
  return getImageUrlFromDownloadUrl(downloadUrl, fallback);
}
