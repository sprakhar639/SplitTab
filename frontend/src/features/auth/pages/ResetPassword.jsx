import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthVisual from "../components/AuthVisual";
import api from "../../../services/api";
import "../styles/Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const isPasswordValid = password.length >= 8;

  const isFormValid =
    Boolean(token) &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!token) {
      setError("Invalid or missing reset link. Please request a new one.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/reset-password", {
        password,
        token,
      });

      navigate("/login", {
        replace: true,
        state: {
          successMessage:
            "Password changed successfully. Please log in with your new password.",
        },
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to reset your password. The link may have expired or already been used.",
      );
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

            <h2>Reset Password</h2>

            <p>Create a new password for your SplitTab account.</p>
          </div>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          {!token ? (
            <div>
              <p className="field-error">
                This reset link is invalid or incomplete.
              </p>

              <div className="auth-footer">
                <Link to="/forgot-password">Request a new reset link</Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="auth-field">
                  <label htmlFor="password">New Password</label>

                  <div className="password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      disabled={submitting}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={submitting}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {password.length > 0 && !isPasswordValid && (
                    <span className="field-error">
                      Password must be at least 8 characters.
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label htmlFor="confirmPassword">Confirm New Password</label>

                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      disabled={submitting}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      disabled={submitting}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <span className="field-error">Passwords do not match.</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={!isFormValid || submitting}
                >
                  {submitting ? "Resetting Password..." : <>Reset Password</>}
                </button>
              </form>

              <div className="auth-footer">
                Remembered your password? <Link to="/login">Back to Login</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
