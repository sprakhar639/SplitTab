import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import AuthVisual from "../components/AuthVisual";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { googleError } = useOutletContext();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || location.state?.message || "",
  );

  // Clear navigation state after displaying success message.
  useEffect(() => {
    if (!successMessage) return;

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage, navigate, location.pathname, location.search]);

  // Handle input changes.
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));
  }

  // Validate login form.
  function validate() {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Email or username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  }

  // Normal email/password login.
  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    try {
      await login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      navigate(location.state?.from ?? "/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrors({
        form: error.message,
      });
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
            <span className="form-tag">WELCOME BACK</span>

            <h2>Login to SplitTab</h2>

            <p>Continue managing your shared expenses.</p>
          </div>

          {successMessage && (
            <p className="form-success" role="status">
              {successMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="identifier">Email or username</label>

              <input
                id="identifier"
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="you@gmail.com"
                autoComplete="username"
                className={errors.identifier ? "input-error" : ""}
              />

              {errors.identifier && (
                <span className="field-error">{errors.identifier}</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={errors.password ? "input-error" : ""}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <span>Remember me</span>
              </label>

              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {errors.form && (
              <span className="field-error" role="alert">
                {errors.form}
              </span>
            )}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? (
                "Logging in…"
              ) : (
                <>
                  Login <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span />
            or continue with
            <span />
          </div>

          <div className="social-buttons">
            <div
              id="google-signin-button"
              aria-label="Google sign-in"
              style={{
                width: "40px",
                minWidth: "40px",
                height: "40px",
                minHeight: "40px",
                flex: "0 0 40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            />
          </div>

          {googleError && (
            <span className="field-error" role="alert">
              {googleError}
            </span>
          )}

          <div className="auth-footer">
            New to SplitTab? <Link to="/register">Create account</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
