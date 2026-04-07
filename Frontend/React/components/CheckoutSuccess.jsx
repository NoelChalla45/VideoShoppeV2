// Stripe checkout success page that finalizes the order after payment.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/cart.css";
import { clearCartItems } from "../utils/cart";
import { apiFetchJson } from "../utils/api";
import { getToken } from "../utils/auth";

export default function CheckoutSuccess() {
  const token = getToken();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId || !token) {
      setStatus("error");
      setError("Missing Stripe session information.");
      return;
    }

    const confirmCheckout = async () => {
      try {
        await apiFetchJson("/api/orders/checkout/confirm", {
          method: "POST",
          token,
          body: JSON.stringify({ sessionId }),
          errorMessage: "Failed to confirm Stripe checkout.",
        });
        clearCartItems();
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err.message || "Failed to confirm Stripe checkout.");
      }
    };

    confirmCheckout();
  }, [searchParams, token]);

  return (
    <div className="cart-page">
      <div className="cart-inner">
        <section className="cart-empty">
          {status === "loading" && <p>Finalizing your Stripe checkout...</p>}
          {status === "success" && (
            <>
              <p>Your payment was successful and your order is complete.</p>
              <Link to="/account" className="cart-primary-btn">Go to Account</Link>
            </>
          )}
          {status === "error" && (
            <>
              <p>{error || "There was a problem finalizing your checkout."}</p>
              <Link to="/cart" className="cart-secondary-btn">Return to Cart</Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
