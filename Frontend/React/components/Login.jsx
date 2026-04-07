// Login and registration screen for all user roles.
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/login.css";
import { apiFetchJson } from "../utils/api";
import { getHomeRoute, setAuthSession } from "../utils/auth";

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Allow the landing page to open this screen in register mode.
    useEffect(() => {
        if (location.state?.mode === "register") {
            setMode("register");
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Switch between login and registration endpoints.
        const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
        const body = mode === "login" ? { email, password } : { email, password, name: name.trim() };

        try {
            const data = await apiFetchJson(endpoint, {
                method: "POST",
                body: JSON.stringify(body),
                errorMessage: "Something went wrong.",
            });

            setAuthSession(data.token, data.user);
            navigate(getHomeRoute(data.user?.role));
        } catch (err) {
            setError(err.message || "Could not reach the server. Is the backend running?");
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === "login" ? "register" : "login");
        setError("");
        setName("");
        setEmail("");
        setPassword("");
    };

    return (
        <div className="login-page">
            <Link to="/" className="login-back-link">Back to Home</Link>
            <div className="login-card">
                <div className="login-brand">
                    <span className="login-brand-icon">🎬</span>
                    <h1 className="login-brand-name">Video Shoppe</h1>
                    <p className="login-brand-tagline">Your world of cinema awaits</p>
                </div>

                <div className="mode-toggle">
                    <button
                        className={`mode-btn ${mode === "login" ? "active" : ""}`}
                        onClick={() => { setMode("login"); setError(""); }}
                        type="button"
                    >
                        Sign In
                    </button>
                    <button
                        className={`mode-btn ${mode === "register" ? "active" : ""}`}
                        onClick={() => { setMode("register"); setError(""); }}
                        type="button"
                    >
                        Create Account
                    </button>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {mode === "register" && (
                        <div className="input-group">
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password {mode === "register" && <span className="optional">(min 6 chars)</span>}</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {mode === "login" && (
                        <div className="login-options">
                            <label className="remember-me">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className="forgot-link">Forgot password?</a>
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <button
                        type="submit"
                        className={`login-btn ${isLoading ? "loading" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <span className="spinner"></span>
                            : mode === "login" ? "Sign In" : "Create Account"
                        }
                    </button>
                </form>

                <p className="signup-prompt">
                    {mode === "login"
                        ? <>Don&apos;t have an account? <a onClick={switchMode} href="#">Sign up free</a></>
                        : <>Already have an account? <a onClick={switchMode} href="#">Sign in</a></>
                    }
                </p>
            </div>
        </div>
    );
};

export default Login;
