// Local storage helpers for cart items.
const CART_KEY = "videoShoppeCart_v2";

export function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addItemToCart(movie, mode = "rent") {
  const items = getCartItems();
  // Buying uses the store's fixed 5x rental-price rule.
  const unitPrice = mode === "buy" ? Number(movie.price || 0) * 5 : Number(movie.price || 0);
  const itemKey = `${movie.id}-${mode}`;
  const existingIndex = items.findIndex((item) => item.itemKey === itemKey);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + 1,
    };
  } else {
    items.unshift({
      itemKey,
      id: movie.id,
      name: movie.name,
      image: movie.image || "",
      mode,
      quantity: 1,
      unitPrice: Number(unitPrice.toFixed(2)),
    });
  }

  saveCartItems(items);
  return items;
}

export function removeCartItem(itemKey) {
  const items = getCartItems().filter((item) => item.itemKey !== itemKey);
  saveCartItems(items);
  return items;
}

export function clearCartItems() {
  saveCartItems([]);
}
