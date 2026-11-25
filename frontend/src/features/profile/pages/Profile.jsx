import { useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../../shared/components/Avatar";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import { changePassword, updateProfile } from "../profile.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function Notice({ children }) {
  return (
    <p
      role="status"
      className="rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success"
    >
      ✓ {children}
    </p>
  );
}

// PROFILE DETAILS FORM
function DetailsForm({ user, onSaved }) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const changed = ["name", "username", "email"].some(
    (key) => form[key].trim() !== (user[key] ?? ""),
  );

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));

    setNotice("");
  }

  function validate() {
    const newErrors = {};

    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim();

    if (name.length < 2) {
      newErrors.name = "Name must contain at least 2 characters";
    }

    if (!USERNAME_REGEX.test(username)) {
      newErrors.username = "Use 3-20 letters, numbers or underscores";
    }

    if (!EMAIL_REGEX.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const changes = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
    };

    setSaving(true);

    try {
      const updatedUser = await updateProfile(changes);

      onSaved(updatedUser);

      setForm({
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
      });

      setNotice("Profile updated successfully");
    } catch (err) {
      setErrors({
        form: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6"
    >
      <div>
        <h2 className="text-base font-extrabold cursor-default select-none">
          Personal details
        </h2>
      </div>

      <Input
        id="profile-name"
        name="name"
        label="Full name"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
        autoComplete="name"
      />

      <Input
        id="profile-username"
        name="username"
        label="Username"
        value={form.username}
        onChange={handleChange}
        error={errors.username}
        autoComplete="username"
      />

      <Input
        id="profile-email"
        name="email"
        type="email"
        label="Email address"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        autoComplete="email"
      />

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
          {errors.form}
        </p>
      )}

      {notice && <Notice>{notice}</Notice>}

      <Button
        type="submit"
        loading={saving}
        disabled={!changed || saving}
        className="self-start"
      >
        Save changes
      </Button>
    </form>
  );
}

// PASSWORD FORM
function PasswordForm() {
  const empty = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));

    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = "Enter your current password";
    }

    if (form.newPassword.length < 8) {
      newErrors.newPassword = "Password must contain at least 8 characters";
    } else if (form.newPassword === form.currentPassword) {
      newErrors.newPassword = "Choose a password you haven't used here";
    }

    if (form.confirmPassword !== form.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm(empty);
      setNotice("Password changed successfully");
    } catch (err) {
      setErrors({
        form: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6"
    >
      <div>
        <h2 className="text-base font-extrabold cursor-default select-none">
          Password
        </h2>
      </div>

      <Input
        id="current-password"
        name="currentPassword"
        type="password"
        label="Current password"
        value={form.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
        autoComplete="current-password"
      />

      <Input
        id="new-password"
        name="newPassword"
        type="password"
        label="New password"
        value={form.newPassword}
        onChange={handleChange}
        error={errors.newPassword}
        autoComplete="new-password"
      />

      <Input
        id="confirm-new-password"
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
          {errors.form}
        </p>
      )}

      {notice && <Notice>{notice}</Notice>}

      <Button
        type="submit"
        loading={saving}
        disabled={saving}
        className="self-start"
      >
        Change password
      </Button>
    </form>
  );
}

// PROFILE PAGE
export default function Profile() {
  const { user, updateUser } = useAuth();

  const displayName = user.name || user.username || user.email;

  return (
    <div className="flex flex-col gap-6">
      {/* PROFILE HEADER */}
      <div className="flex items-center gap-4">
        <Avatar name={displayName} id={user.id} size="size-14" />

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight cursor-default select-none">
            {displayName}
          </h1>

          <p className="text-sm text-mute cursor-default select-none">
            {user.email || "No email on file"}
          </p>
        </div>
      </div>

      {/* PROFILE FORMS */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <DetailsForm user={user} onSaved={updateUser} />

        <PasswordForm />
      </div>
    </div>
  );
}
