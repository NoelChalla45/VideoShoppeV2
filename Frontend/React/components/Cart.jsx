// Shopping cart page for rentals and purchases before checkout.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/cart.css";
import { clearCartItems, getCartItems, removeCartItem } from "../utils/cart";
import { apiFetchJson } from "../utils/api";
import { getStoredUser, getToken } from "../utils/auth";
import { getActiveRentalQuantityFromOrders } from "../utils/orders";
import { canCheckoutRentals } from "../utils/rentalRules";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";


function StripeCheckoutForm({
  items,
  total,
  phone,
  address,
  onSuccess,
  setIsCheckingOut,
  isCheckingOut,
  onCancel
}) {
  const stripe = useStripe();
  const elements = useElements();
  const token = getToken();

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsCheckingOut(true);

    try {
      const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

      const intentRes = await fetch(`${API}/api/orders/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      });

      const { clientSecret, error: intentErr } = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentErr || "Server error.");

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (stripeErr) throw new Error(stripeErr.message);

      if (paymentIntent.status === "succeeded") {
        const orderRes = await fetch(`${API}/api/orders/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": authHeader },
          body: JSON.stringify({
            items: items.map(i => ({ id: i.id, quantity: i.quantity, mode: i.mode })),
            contact: { phone, address }
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Order failed to save.");

        onSuccess();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="stripe-form">
      <div className="card-input-container" style={{ padding: '12px', background: '#1a1a1a', borderRadius: '4px', marginBottom: '15px', border: '1px solid #333' }}>
        <CardElement options={{
          hidePostalCode: true,
          style: { base: { fontSize: "16px", color: "#fff", "::placeholder": { color: "#666" } } }
        }} />
      </div>
      <button className="cart-primary-btn" type="submit" disabled={isCheckingOut || !stripe}>
        {isCheckingOut ? "Processing..." : `Pay $${total.toFixed(2)}`}
      </button>
      <button className="cart-secondary-btn full" type="button" onClick={onCancel} disabled={isCheckingOut} style={{ marginTop: '10px' }}>
        Back to Details
      </button>
    </form>
  );
}

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
  const [showStripe, setShowStripe] = useState(false);

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

  const handleProceedToPayment = () => {
    setCheckoutError("");
    
    if (!checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      setCheckoutError("Phone number and address are required before checkout.");
      return;
    }

    const limitCheck = canCheckoutRentals(activeRentalQty);
    if (!limitCheck.allowed) {
      setCheckoutError(`You can only rent up to ${limitCheck.maxAllowed} DVDs at a time.`);
      return;
    }

    setShowStripe(true);
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

              {!showStripe ? (
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
                  <button className="cart-primary-btn" onClick={handleProceedToPayment} disabled={isLoadingRentalState}>
                    {isLoadingRentalState ? "Loading..." : "Proceed to Payment"}
                  </button>
                </div>
              ) : (
                <div className="stripe-checkout-section">
                  <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '10px' }}>Secure Stripe Payment</p>
                  <Elements stripe={stripePromise}>
                    <StripeCheckoutForm
                      items={items}
                      total={totals.subtotal}
                      phone={checkoutForm.phone}
                      address={checkoutForm.address}
                      isCheckingOut={isCheckingOut}
                      setIsCheckingOut={setIsCheckingOut}
                      onCancel={() => setShowStripe(false)}
                      onSuccess={() => { 
                        handleClear(); 
                        navigate("/account"); 
                      }}
                    />
                  </Elements>
                </div>
              )}

              <button className="cart-secondary-btn full" onClick={handleClear} disabled={isCheckingOut}>
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
