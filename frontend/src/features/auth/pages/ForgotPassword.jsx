import { useState } from "react";
import { Link } from "react-router-dom";

import AuthVisual from "../components/AuthVisual";
import api from "../../../services/api";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return "Email is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Please enter a valid email address";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setSuccess(
        "If an account exists for this email, a password reset link will be sent. Please check your inbox.",
      );

      setEmail("");
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthVisual variant="login" />

      <section className="auth-form-section">
        <div className="auth-container">
          <div className="auth-heading">
            <span className="form-tag">ACCOUNT RECOVERY</span>

            <h2>Forgot Password?</h2>

            <p>
              Enter your registered email address. We'll send you a link to
              reset your password.
            </p>
          </div>

          {success && (
            <p className="form-success" role="status">
              {success}
            </p>
          )}

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="you@gmail.com"
                autoComplete="email"
                className={error ? "input-error" : ""}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting ? (
                "Sending reset link..."
              ) : (
                <>
                  Send Reset Link <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Remember your password? <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </section>
    </main>
  );
}