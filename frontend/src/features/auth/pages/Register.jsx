import { useState } from "react";

import { Link, useNavigate, useOutletContext } from "react-router-dom";

import AuthVisual from "../components/AuthVisual";

import { useAuth } from "../../../context/AuthContext";

import "../styles/Auth.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();
  const { googleError } = useOutletContext();

  const [formData, setFormData] = useState({
    name: "",

    username: "",

    email: "",

    password: "",
  });

  const [errors, setErrors] = useState({});

  const [serverError, setServerError] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

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
    }));

    setServerError("");
  }

  // Validate registration form.

  function validate() {
    const newErrors = {};

    const name = formData.name.trim();

    const username = formData.username.trim();

    const email = formData.email.trim();

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must contain at least 2 characters";
    }

    if (!username) {
      newErrors.username = "Username is required";
    } else if (!USERNAME_REGEX.test(username)) {
      newErrors.username =
        "Username must contain 3-20 letters, numbers or underscores";
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

    return newErrors;
  }

  // Normal email/password registration.

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);

      setServerError("");

      await register({
        name: formData.name.trim(),

        username: formData.username.trim(),

        email: formData.email.trim(),

        password: formData.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthVisual variant="register" />

      <section className="auth-form-section">
        <div className="auth-container register-container">
          <div className="auth-heading">
            <span className="form-tag cursor-default select-none">
              GET STARTED
            </span>

            <h2 className="cursor-default select-none">Create your account</h2>

            <p className="cursor-default select-none">
              Start managing shared expenses with friends.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* Full Name */}

            <div className="auth-field">
              <label htmlFor="name" className="cursor-default select-none">
                Full name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                className={`cursor-text select-text ${
                  errors.name ? "input-error" : ""
                }`}
              />

              {errors.name && (
                <span className="field-error cursor-default select-none">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Username */}

            <div className="auth-field">
              <label htmlFor="username" className="cursor-default select-none">
                Username
              </label>

              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                autoComplete="off"
                spellCheck="false"
                className={`cursor-text select-text ${
                  errors.username ? "input-error" : ""
                }`}
              />

              {errors.username && (
                <span className="field-error cursor-default select-none">
                  {errors.username}
                </span>
              )}
            </div>

            {/* Email */}

            <div className="auth-field">
              <label htmlFor="email" className="cursor-default select-none">
                Email address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@gmail.com"
                autoComplete="email"
                className={`cursor-text select-text ${
                  errors.email ? "input-error" : ""
                }`}
              />

              {errors.email && (
                <span className="field-error cursor-default select-none">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}

            <div className="auth-field">
              <label htmlFor="password" className="cursor-default select-none">
                Password
              </label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className={`cursor-text select-text ${
                    errors.password ? "input-error" : ""
                  }`}
                />

                <button
                  type="button"
                  className="password-toggle cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <span className="field-error cursor-default select-none">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Backend Error */}

            {serverError && (
              <p
                className="field-error cursor-default select-none"
                role="alert"
              >
                {serverError}
              </p>
            )}

            {/* Submit */}

            <button
              type="submit"
              className="auth-submit cursor-pointer"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}

              {!loading && <span>→</span>}
            </button>
          </form>

          {/* Social Signup */}

          <div className="auth-divider cursor-default select-none">
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

          {/* Footer */}

          <div className="auth-footer cursor-default select-none">
            Already have an account?{" "}
            <Link to="/login" className="cursor-pointer">
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
