// Shared rental-limit rules used by the customer flow.
import { getCartItems } from "./cart";

export const MAX_RENTALS_ALLOWED = 3;

function getCartRentalQuantity() {
  const items = getCartItems();
  return items
    .filter((item) => item.mode === "rent")
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function canAddRentalToCart(activeRentalQty = 0, nextQuantity = 1) {
  const cartRentalQty = getCartRentalQuantity();
  const projectedTotal = activeRentalQty + cartRentalQty + Number(nextQuantity || 0);

  return {
    allowed: projectedTotal <= MAX_RENTALS_ALLOWED,
    remaining: Math.max(0, MAX_RENTALS_ALLOWED - (activeRentalQty + cartRentalQty)),
    maxAllowed: MAX_RENTALS_ALLOWED,
  };
}

export function canCheckoutRentals(activeRentalQty = 0) {
  const cartRentalQty = getCartRentalQuantity();
  const projectedTotal = activeRentalQty + cartRentalQty;

  return {
    allowed: projectedTotal <= MAX_RENTALS_ALLOWED,
    remaining: Math.max(0, MAX_RENTALS_ALLOWED - activeRentalQty),
    maxAllowed: MAX_RENTALS_ALLOWED,
  };
}
