// Local storage helpers for temporary customer account activity.
const ACCOUNT_ACTIVITY_KEY = "videoShoppeAccountActivity_v5";

function getStorage() {
  try {
    const raw = localStorage.getItem(ACCOUNT_ACTIVITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStorage(allData) {
  localStorage.setItem(ACCOUNT_ACTIVITY_KEY, JSON.stringify(allData));
}

function getUserKey(user) {
  return String(user?.id || user?.email || "guest");
}

export function getAccountActivity(user) {
  const allData = getStorage();
  const userKey = getUserKey(user);
  const data = allData[userKey];

  if (!data) {
    return { activeRentals: [], history: [] };
  }

  return {
    activeRentals: Array.isArray(data.activeRentals) ? data.activeRentals : [],
    history: Array.isArray(data.history) ? data.history : [],
  };
}

export function recordCheckout(user, cartItems) {
  const allData = getStorage();
  const userKey = getUserKey(user);
  const existing = getAccountActivity(user);
  const now = new Date();
  const nowIso = now.toISOString();
  const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const newActiveRentals = [];
  const newHistory = [];

  // Rentals stay active and also get copied into history.
  cartItems.forEach((item) => {
    const historyEntry = {
      entryId: `${item.itemKey}-${nowIso}`,
      id: item.id,
      name: item.name,
      image: item.image || "",
      mode: item.mode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: Number((item.unitPrice * item.quantity).toFixed(2)),
      date: nowIso,
      status: item.mode === "rent" ? "Active Rental" : "Purchased",
      dueDate: item.mode === "rent" ? dueDate : null,
    };

    newHistory.push(historyEntry);

    if (item.mode === "rent") {
      newActiveRentals.push({
        rentalId: `${item.itemKey}-${nowIso}`,
        id: item.id,
        name: item.name,
        image: item.image || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        rentedAt: nowIso,
        dueDate,
      });
    }
  });

  allData[userKey] = {
    activeRentals: [...newActiveRentals, ...existing.activeRentals],
    history: [...newHistory, ...existing.history],
  };

  saveStorage(allData);
  return allData[userKey];
}
