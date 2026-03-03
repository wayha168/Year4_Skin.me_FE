/**
 * Single place for cart item quantity update. Used by bag page and checkout page.
 * Tries backend endpoints (my-cart first for skinme.store); returns true if any succeeded.
 */
export async function updateCartItemQuantity(axiosAuth, itemId, quantity) {
  const qty = Math.max(1, Number(quantity));
  const endpoints = [
    { method: "patch", url: `/carts/my-cart/items/${itemId}`, data: { quantity: qty } },
    { method: "put", url: `/carts/my-cart/items/${itemId}`, data: { quantity: qty } },
    { method: "put", url: "/carts/my-cart/items/update", data: { itemId, quantity: qty } },
    { method: "put", url: "/carts/my-cart/items/update", data: { cartItemId: itemId, quantity: qty } },
    { method: "put", url: "/carts/my-cart/items/update", params: { cartItemId: itemId, quantity: qty } },
    { method: "put", url: "/cartItems/update", data: { cartItemId: itemId, quantity: qty } },
    { method: "put", url: "/cartItems/item/update", data: { itemId, quantity: qty } },
    { method: "patch", url: `/cartItems/${itemId}`, data: { quantity: qty } },
    { method: "put", url: `/cartItems/${itemId}`, data: { quantity: qty } },
    { method: "put", url: "/carts/items/update", data: { itemId, quantity: qty } },
    { method: "patch", url: `/carts/items/${itemId}`, data: { quantity: qty } },
  ];

  for (const ep of endpoints) {
    try {
      const config = { withCredentials: true };
      if (ep.params) config.params = ep.params;
      if (ep.method === "put") {
        await axiosAuth.put(ep.url, ep.data || {}, config);
      } else {
        await axiosAuth.patch(ep.url, ep.data || {}, config);
      }
      return true;
    } catch (_) {
      continue;
    }
  }
  return false;
}

/**
 * Remove one item from cart. Tries my-cart endpoints first (skinme.store).
 * @param {import('axios').AxiosInstance} axiosAuth
 * @param {string|number} itemId - Cart item id to remove
 * @param {string|number} [userId] - Optional, for legacy endpoints that require it
 * @returns {Promise<boolean>}
 */
export async function removeCartItem(axiosAuth, itemId, userId) {
  const endpoints = [
    { url: `/carts/my-cart/items/${itemId}` },
    { url: `/carts/my-cart/item/${itemId}` },
    { url: "/carts/my-cart/items/remove", params: { itemId } },
    { url: "/carts/my-cart/items/remove", params: { cartItemId: itemId } },
    { url: "/carts/my-cart/remove", params: { itemId } },
    { url: "/carts/my-cart/remove", data: { itemId } },
    { url: "/cart/remove", params: { itemId, userId } },
    { url: "/carts/remove", params: { itemId, userId } },
    { url: "/cartItems/remove", params: { itemId, userId } },
  ].filter((ep) => !ep.params?.userId || userId);

  for (const ep of endpoints) {
    try {
      const config = { withCredentials: true };
      if (ep.params) config.params = ep.params;
      if (ep.data) config.data = ep.data;
      await axiosAuth.delete(ep.url, config);
      return true;
    } catch (_) {
      continue;
    }
  }
  return false;
}
