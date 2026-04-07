// Helpers for deriving customer account data from backend orders.
import { MAX_RENTALS_ALLOWED } from "./rentalRules";

const RENTAL_WINDOW_DAYS = 3;

function toImage(item) {
  return item.inventory?.image || "/placeholder-dvd.png";
}

export function getActiveRentalQuantityFromOrders(orders = []) {
  return orders.reduce((sum, order) => {
    const rentalQty = (order.items || []).reduce((itemSum, item) => {
      if (item.orderType !== "RENTAL") return itemSum;
      return itemSum + Number(item.quantity || 0);
    }, 0);

    return sum + rentalQty;
  }, 0);
}

export function getAccountActivityFromOrders(orders = []) {
  const activeRentals = [];
  const history = [];

  orders.forEach((order) => {
    const orderDate = order.createdAt;
    const dueDate = new Date(
      new Date(order.createdAt).getTime() + RENTAL_WINDOW_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    (order.items || []).forEach((item) => {
      const baseEntry = {
        id: item.inventoryId,
        name: item.title,
        image: toImage(item),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
      };

      history.push({
        entryId: `${order.id}-${item.id}`,
        ...baseEntry,
        mode: item.orderType === "RENTAL" ? "rent" : "buy",
        totalPrice: Number((Number(item.unitPrice || 0) * Number(item.quantity || 0)).toFixed(2)),
        date: orderDate,
        status: item.orderType === "RENTAL" ? "Active Rental" : "Purchased",
        dueDate: item.orderType === "RENTAL" ? dueDate : null,
      });

      if (item.orderType === "RENTAL") {
        activeRentals.push({
          rentalId: `${order.id}-${item.id}`,
          ...baseEntry,
          rentedAt: orderDate,
          dueDate,
        });
      }
    });
  });

  return {
    activeRentals,
    history,
    maxRentalsAllowed: MAX_RENTALS_ALLOWED,
  };
}
