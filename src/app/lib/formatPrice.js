/**
 * Format price as "$ 00.00" (space after $, two decimals).
 * @param {number|string|null|undefined} price
 * @returns {string} e.g. "$ 12.99"
 */
export function formatPrice(price) {
  return `$ ${Number(price ?? 0).toFixed(2)}`;
}
