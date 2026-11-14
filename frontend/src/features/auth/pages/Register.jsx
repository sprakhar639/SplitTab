import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import AuthVisual from "../components/AuthVisual";
import "../styles/Auth.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  function validate() {
    const newErrors = {};

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must contain at least 2 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!USERNAME_REGEX.test(formData.username.trim())) {
      newErrors.username = "Use 3-20 letters, numbers or underscores";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrors({ form: error.message });
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthVisual variant="register" />

      <section className="auth-form-section">
        <div className="auth-container register-container">
          <div className="auth-heading">
            <span className="form-tag">GET STARTED</span>

            <h2>Create your account</h2>

            <p>Start managing shared expenses with friends.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                className={errors.name ? "input-error" : ""}
              />

              {errors.name && (
                <span className="field-error">{errors.name}</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Pick a username"
                autoComplete="username"
                className={errors.username ? "input-error" : ""}
              />

              {errors.username && (
                <span className="field-error">{errors.username}</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@gmail.com"
                autoComplete="email"
                className={errors.email ? "input-error" : ""}
              />

              {errors.email && (
                <span className="field-error">{errors.email}</span>
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
                  placeholder="Create a password"
                  autoComplete="new-password"
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

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={
                    errors.confirmPassword ? "input-error" : ""
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <span className="field-error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {errors.form && <span className="field-error">{errors.form}</span>}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "Creating account…" : <>Create account <span>→</span></>}
            </button>
          </form>

          <div className="auth-divider">
            <span />
            or continue with
            <span />
          </div>

          <div className="social-buttons">
            <button type="button" aria-label="Google signup">G</button>
            <button type="button" aria-label="GitHub signup">GH</button>
            <button type="button" aria-label="LinkedIn signup">in</button>
          </div>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </section>
    </main>
  );
}