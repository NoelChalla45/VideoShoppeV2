// Shopping cart page for rentals and purchases before checkout.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/cart.css";
import { clearCartItems, getCartItems, removeCartItem } from "../utils/cart";
import { apiFetchJson } from "../utils/api";
import { getStoredUser, getToken } from "../utils/auth";
import { getActiveRentalQuantityFromOrders } from "../utils/orders";
import { canCheckoutRentals } from "../utils/rentalRules";

export default function Cart() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.id || "";
  const token = getToken();
  const [items, setItems] = useState(getCartItems());
  const [checkoutForm, setCheckoutForm] = useState({
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeRentalQty, setActiveRentalQty] = useState(0);
  const [isLoadingRentalState, setIsLoadingRentalState] = useState(true);

  // Build the order summary values shown in the sidebar.
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const lineTotal = item.unitPrice * item.quantity;
        acc.subtotal += lineTotal;
        if (item.mode === "rent") acc.rentals += lineTotal;
        if (item.mode === "buy") acc.purchases += lineTotal;
        return acc;
      },
      { rentals: 0, purchases: 0, subtotal: 0 }
    );
  }, [items]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token || !user) {
        setActiveRentalQty(0);
        setIsLoadingRentalState(false);
        return;
      }

      setIsLoadingRentalState(true);

      try {
        const [profileResponse, orders] = await Promise.all([
          apiFetchJson("/api/auth/me", {
            token,
            errorMessage: "Failed to load checkout details.",
          }),
          apiFetchJson("/api/orders/mine", {
            token,
            errorMessage: "Failed to load active rentals.",
          }),
        ]);

        setCheckoutForm({
          phone: profileResponse.user?.phone || user?.phone || "",
          address: profileResponse.user?.address || user?.address || "",
        });
        setActiveRentalQty(getActiveRentalQuantityFromOrders(orders));
      } catch (err) {
        setCheckoutError(err.message || "Failed to load checkout details.");
      } finally {
        setIsLoadingRentalState(false);
      }
    };

    loadOrders();
  }, [token, userId]);

  const handleRemove = (itemKey) => {
    const next = removeCartItem(itemKey);
    setItems(next);
  };

  const handleClear = () => {
    clearCartItems();
    setItems([]);
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0 || isCheckingOut) return;

    const phone = checkoutForm.phone.trim();
    const address = checkoutForm.address.trim();

    setCheckoutError("");
    setIsCheckingOut(true);

    try {
      if (!phone || !address) {
        setCheckoutError("Phone number and address are required before checkout.");
        setIsCheckingOut(false);
        return;
      }

      const limitCheck = canCheckoutRentals(activeRentalQty);
      if (!limitCheck.allowed) {
        setCheckoutError(`You can only rent up to ${limitCheck.maxAllowed} DVDs at a time.`);
        setIsCheckingOut(false);
        return;
      }

      const payload = await apiFetchJson("/api/orders/checkout/session", {
        method: "POST",
        token,
        body: JSON.stringify({
          contact: { phone, address },
          items: items.map((item) => ({ id: item.id, quantity: item.quantity, mode: item.mode })),
        }),
        errorMessage: "Failed to start Stripe checkout.",
      });

      if (!payload?.url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.assign(payload.url);
    } catch (err) {
      setCheckoutError(err.message || "Could not reach server to start Stripe checkout.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-inner">
        <header className="cart-head">
          <div>
            <p className="cart-eyebrow">Checkout Prep</p>
            <h1>Your Cart</h1>
          </div>
          <button className="cart-secondary-btn" onClick={() => navigate("/catalog")}>
            Keep Browsing
          </button>
        </header>

        {items.length === 0 ? (
          <section className="cart-empty">
            <p>Your cart is empty.</p>
            <button className="cart-primary-btn" onClick={() => navigate("/catalog")}>
              Browse Catalog
            </button>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.itemKey}>
                  <img src={item.image || "/placeholder-dvd.png"} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h2>{item.name}</h2>
                    <p className="cart-item-mode">{item.mode === "rent" ? "Rental" : "Purchase"}</p>
                    <p className="cart-item-price">
                      ${item.unitPrice.toFixed(2)}
                      {item.mode === "rent" ? " / day" : ""}
                    </p>
                    <p className="cart-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <div className="cart-item-actions">
                    <strong>${(item.unitPrice * item.quantity).toFixed(2)}</strong>
                    <button className="cart-remove-btn" onClick={() => handleRemove(item.itemKey)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Rentals</span>
                <span>${totals.rentals.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Purchases</span>
                <span>${totals.purchases.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-checkout-fields">
                <div className="cart-field">
                  <label htmlFor="checkout-phone">Phone Number</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="cart-field">
                  <label htmlFor="checkout-address">Address</label>
                  <textarea
                    id="checkout-address"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State ZIP"
                    rows="3"
                  />
                </div>
              </div>
              <button className="cart-primary-btn" onClick={handleCheckout} disabled={isCheckingOut || isLoadingRentalState}>
                {isLoadingRentalState ? "Loading..." : isCheckingOut ? "Redirecting..." : "Checkout with Stripe"}
              </button>
              <button className="cart-secondary-btn full" onClick={handleClear}>
                Clear Cart
              </button>
              {checkoutError && <p className="cart-error">{checkoutError}</p>}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
