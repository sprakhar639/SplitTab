import { useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../../shared/components/Avatar";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import { changePassword, updateProfile } from "../profile.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const glassCard = `
  relative isolate flex flex-col gap-4
  overflow-hidden rounded-2xl
  border border-white/90
  bg-white/65 p-3 sm:p-4
  shadow-[0_15px_45px_rgba(20,65,47,0.07)]
  backdrop-blur-2xl
  transition-all duration-300
  hover:border-white
  hover:bg-white/75
  hover:shadow-[0_20px_55px_rgba(20,65,47,0.11)]
`;

function Notice({ children }) {
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-800 cursor-default"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-xs text-white cursor-default">
        ✓
      </span>
      {children}
    </p>
  );
}

function CardHeading({ children }) {
  return (
    <div className="relative">
      <h2 className="cursor-default select-none text-lg font-bold tracking-tight text-[#16382B]">
        {children}
      </h2>

      <div className="mt-3 h-px bg-gradient-to-r from-[#397C5B]/30 via-[#DCE8DF] to-transparent" />
    </div>
  );
}

// PERSONAL DETAILS FORM
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
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={glassCard}>
      {/* GLASS REFLECTION */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/90 via-white/30 to-[#DCECE1]/35" />

      <CardHeading>Personal details</CardHeading>

      <div className="relative flex flex-col gap-3">
        <Input
          id="profile-name"
          name="name"
          label="Full name"
          placeholder="Enter your full name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          autoComplete="name"
        />

        <Input
          id="profile-username"
          name="username"
          label="Username"
          placeholder="Choose a username"
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
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
      </div>

      {errors.form && (
        <p className="relative cursor-default rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm font-medium text-danger">
          {errors.form}
        </p>
      )}

      {notice && (
        <div className="relative">
          <Notice>{notice}</Notice>
        </div>
      )}

      <div className="relative mt-1 flex justify-end border-t border-[#DCE8DF]/80 pt-3">
        <Button
          type="submit"
          loading={saving}
          disabled={!changed || saving}
          className="self-start cursor-pointer disabled:cursor-not-allowed"
        >
          Save changes
        </Button>
      </div>
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
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={glassCard}>
      {/* GLASS REFLECTION */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/90 via-white/30 to-[#DCECE1]/35" />

      <CardHeading>Password</CardHeading>

      <div className="relative flex flex-col gap-3.5">
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          label="Current password"
          placeholder="Enter current password"
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
          placeholder="Enter new password"
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
          placeholder="Confirm your new password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      {errors.form && (
        <p className="relative cursor-default rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm font-medium text-danger">
          {errors.form}
        </p>
      )}

      {notice && (
        <div className="relative">
          <Notice>{notice}</Notice>
        </div>
      )}

      <div className="relative mt-1 flex justify-end border-t border-[#DCE8DF]/80 pt-3">
        <Button
          type="submit"
          loading={saving}
          disabled={saving}
          className="self-start cursor-pointer disabled:cursor-not-allowed"
        >
          Change password
        </Button>
      </div>
    </form>
  );
}

// PROFILE PAGE
export default function Profile() {
  const { user, updateUser } = useAuth();

  const displayName = user.name || user.username || user.email;

  return (
    <main className="relative isolate min-h-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#E9F0EA] via-[#F7F6F0] to-[#E6EEE8] p-2 sm:p-3 lg:p-4">
      {/* BACKGROUND LIGHTING */}
      <div className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-white/80 blur-[110px]" />

      <div className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-[500px] w-[500px] rounded-full bg-[#B9D8C4]/45 blur-[120px]" />

      <div className="pointer-events-none absolute right-1/3 top-1/3 -z-10 h-[350px] w-[350px] rounded-full bg-[#D4E8D9]/50 blur-[110px]" />

      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-3">
        {/* PROFILE HEADER */}
        <header className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/40 p-4 shadow-[0_8px_30px_rgba(20,65,47,0.04)] backdrop-blur-2xl sm:p-5">
          <div className="cursor-default rounded-2xl border border-white/90 bg-white/75 p-1.5 shadow-[0_8px_25px_rgba(20,65,47,0.08)]">
            <Avatar name={displayName} id={user.id} size="size-14" />
          </div>

          <div className="min-w-0">
            <h1 className="cursor-default select-none truncate text-2xl font-extrabold tracking-tight text-[#12392B] sm:text-3xl">
              {displayName}
            </h1>

            <p className="mt-1 cursor-default select-none truncate text-sm text-[#75877D]">
              {user.email || "No email on file"}
            </p>
          </div>
        </header>

        {/* PROFILE FORMS */}
        <section className="grid items-start gap-4 xl:grid-cols-2">
          <DetailsForm user={user} onSaved={updateUser} />
          <PasswordForm />
        </section>
      </div>
    </main>
  );
}
