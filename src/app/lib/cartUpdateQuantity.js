/**
 * Single place for cart item quantity update. Used by bag page and checkout page.
 * Tries backend endpoints (my-cart first for skinme.store); returns true if any succeeded.
 */
export async function updateCartItemQuantity(axiosAuth, itemId, quantity, productId, cartId) {
  const qty = Math.max(1, Number(quantity));
  const id = itemId != null && String(itemId).trim() !== "" ? String(itemId).trim() : null;
  const pid = productId != null && String(productId).trim() !== "" ? String(productId).trim() : null;
  const cid = cartId != null && String(cartId).trim() !== "" ? String(cartId).trim() : null;

  const endpoints = [];
  // Backend: PUT /cartItems/item/{productId}/update?quantity=
  if (pid) {
    endpoints.push(
      { method: "put", url: `/cartItems/item/${pid}/update`, params: { quantity: qty } }
    );
  }
  if (cid && id) {
    endpoints.push(
      { method: "put", url: `/cartItems/cart/${cid}/item/${id}`, data: { quantity: qty } },
      { method: "patch", url: `/cartItems/cart/${cid}/item/${id}`, data: { quantity: qty } },
      { method: "put", url: `/cartItems/cart/${cid}/item/${id}/update`, data: { quantity: qty } },
      { method: "patch", url: `/cartItems/cart/${cid}/item/${id}/update`, data: { quantity: qty } }
    );
  }
  if (id) {
    endpoints.push(
      { method: "patch", url: `/carts/my-cart/items/${id}`, data: { quantity: qty } },
      { method: "put", url: `/carts/my-cart/items/${id}`, data: { quantity: qty } },
      { method: "put", url: "/carts/my-cart/items/update", data: { itemId: id, quantity: qty } },
      { method: "put", url: "/carts/my-cart/items/update", data: { cartItemId: id, quantity: qty } },
      { method: "put", url: "/carts/my-cart/items/update", params: { cartItemId: id, quantity: qty } },
      { method: "put", url: "/cartItems/update", data: { cartItemId: id, quantity: qty } },
      { method: "put", url: "/cartItems/item/update", data: { itemId: id, quantity: qty } },
      { method: "patch", url: `/cartItems/${id}`, data: { quantity: qty } },
      { method: "put", url: `/cartItems/${id}`, data: { quantity: qty } },
      { method: "put", url: "/carts/items/update", data: { itemId: id, quantity: qty } },
      { method: "patch", url: `/carts/items/${id}`, data: { quantity: qty } }
    );
  }
  if (pid) {
    endpoints.push(
      { method: "put", url: "/cartItems/item/update", data: { productId: pid, quantity: qty } },
      { method: "put", url: "/cartItems/update", data: { productId: pid, quantity: qty } },
      { method: "put", url: "/carts/my-cart/items/update", data: { productId: pid, quantity: qty } },
      { method: "patch", url: "/cartItems/item/update", data: { productId: pid, quantity: qty } }
    );
  }

  for (const ep of endpoints) {
    try {
      const config = { withCredentials: true };
      if (ep.params) config.params = ep.params;
      const body = ep.data || {};
      if (ep.method === "put") {
        await axiosAuth.put(ep.url, body, config);
      } else {
        await axiosAuth.patch(ep.url, body, config);
      }
      return true;
    } catch (_) {
      continue;
    }
  }
  return false;
}

/**
 * Remove one item from cart. Tries multiple backend shapes; accepts cartId + itemId (your API) or productId.
 * @param {import('axios').AxiosInstance} axiosAuth
 * @param {string|number} itemId - Cart item id to remove (use id/cartItemId from cart response)
 * @param {string|number} [userId] - Optional, for legacy endpoints that require it
 * @param {string|number} [productId] - Optional; used when backend identifies lines by productId
 * @param {string|number} [cartId] - Optional; when set, tries DELETE /cartItems/cart/:cartId/item/:itemId/remove first
 * @returns {Promise<boolean>}
 */
export async function removeCartItem(axiosAuth, itemId, userId, productId, cartId) {
  const id = itemId != null && String(itemId).trim() !== "" ? String(itemId).trim() : null;
  const pid = productId != null && String(productId).trim() !== "" ? String(productId).trim() : null;
  const cid = cartId != null && String(cartId).trim() !== "" ? String(cartId).trim() : null;
  if (!id && !pid) return false;

  const deleteEndpoints = [];
  const postRemoveEndpoints = [];

  // Backend: DELETE /cartItems/item/{productId}/remove
  if (pid) {
    deleteEndpoints.push(
      { method: "delete", url: `/cartItems/item/${pid}/remove` }
    );
  }
  if (cid && id) {
    deleteEndpoints.push(
      { method: "delete", url: `/cartItems/cart/${cid}/item/${id}/remove` }
    );
  }
  if (id) {
    deleteEndpoints.push(
      { method: "delete", url: `/cartItems/item/${id}` },
      { method: "delete", url: `/cartItems/item/remove`, params: { cartItemId: id } },
      { method: "delete", url: `/cartItems/item/remove`, params: { itemId: id } },
      { method: "delete", url: `/cartItems/item/remove`, data: { cartItemId: id } },
      { method: "delete", url: `/cartItems/item/remove`, data: { itemId: id } },
      { method: "delete", url: `/cartItems/${id}` },
      { method: "delete", url: `/cartItems/remove`, params: { cartItemId: id } },
      { method: "delete", url: `/cartItems/remove`, params: { itemId: id, userId } },
      { method: "delete", url: `/cartItems/remove`, data: { cartItemId: id } },
      { method: "delete", url: `/carts/my-cart/items/${id}` },
      { method: "delete", url: `/carts/my-cart/item/${id}` },
      { method: "delete", url: "/carts/my-cart/items/remove", params: { itemId: id } },
      { method: "delete", url: "/carts/my-cart/items/remove", params: { cartItemId: id } },
      { method: "delete", url: "/carts/my-cart/remove", params: { itemId: id } },
      { method: "delete", url: "/carts/my-cart/remove", data: { itemId: id } },
      { method: "delete", url: "/cart/remove", params: { itemId: id, userId } },
      { method: "delete", url: "/carts/remove", params: { itemId: id, userId } }
    );
    postRemoveEndpoints.push(
      { method: "post", url: `/cartItems/item/remove`, data: { cartItemId: id } },
      { method: "post", url: `/cartItems/item/remove`, data: { itemId: id } },
      { method: "post", url: `/cartItems/remove`, data: { cartItemId: id } }
    );
  }
  if (pid) {
    deleteEndpoints.push(
      { method: "delete", url: `/cartItems/item/remove`, params: { productId: pid } },
      { method: "delete", url: `/cartItems/item/remove`, data: { productId: pid } },
      { method: "delete", url: `/cartItems/remove`, params: { productId: pid } },
      { method: "delete", url: `/cartItems/remove`, data: { productId: pid } },
      { method: "delete", url: "/carts/my-cart/items/remove", params: { productId: pid } },
      { method: "delete", url: "/carts/my-cart/remove", params: { productId: pid } }
    );
    postRemoveEndpoints.push(
      { method: "post", url: `/cartItems/item/remove`, data: { productId: pid } },
      { method: "post", url: `/cartItems/remove`, data: { productId: pid } }
    );
  }

  const allDelete = deleteEndpoints.filter((ep) => !ep.params?.userId || userId);

  const tryRequest = async (ep) => {
    const config = { withCredentials: true };
    if (ep.params) config.params = ep.params;
    if (ep.data) config.data = ep.data;
    if (ep.method === "post") {
      await axiosAuth.post(ep.url, ep.data || {}, config);
    } else {
      await axiosAuth.delete(ep.url, config);
    }
  };

  for (const ep of [...allDelete, ...postRemoveEndpoints]) {
    try {
      await tryRequest(ep);
      return true;
    } catch (_) {
      continue;
    }
  }
  return false;
}
