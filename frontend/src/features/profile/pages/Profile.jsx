import { useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import { usePreview } from "../../../context/PreviewContext";
import Avatar from "../../../shared/components/Avatar";
import FeatureGate from "../../../shared/components/FeatureGate";
import Button from "../../../shared/components/Button";
import ComingSoon from "../../../shared/components/ComingSoon";
import Input from "../../../shared/components/Input";
import { changePassword, updateProfile } from "../profile.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function Notice({ children }) {
  return (
    <p role="status" className="rounded-lg bg-mint/30 px-3 py-2 text-sm font-semibold text-success">
      ✓ {children}
    </p>
  );
}

function DetailsForm({ user, onSaved }) {
  const isPreview = usePreview();
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
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
    setNotice("");
  }

  function validate() {
    const newErrors = {};
    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim();

    if (name.length < 2) newErrors.name = "Name must contain at least 2 characters";
    if (!USERNAME_REGEX.test(username)) newErrors.username = "Use 3-20 letters, numbers or underscores";
    if (!EMAIL_REGEX.test(email)) newErrors.email = "Enter a valid email address";

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const changes = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
    };

    setSaving(true);
    try {
      await updateProfile(user.id, changes);
      if (isPreview) {
        setNotice("Looks good. When this is live, saving will update your profile.");
      } else {
        onSaved(changes);
        setNotice("Profile updated");
      }
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
      <div>
        <h2 className="text-base font-extrabold">Personal details</h2>
        <p className="text-sm text-mute">How you appear to people in your groups.</p>
      </div>

      <Input id="profile-name" name="name" label="Full name" value={form.name} onChange={handleChange} error={errors.name} autoComplete="name" />
      <Input
        id="profile-username"
        name="username"
        label="Username"
        value={form.username}
        onChange={handleChange}
        error={errors.username}
        hint="You can log in with your username or email."
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
        hint="Reminders and reports sent by email go here."
        autoComplete="email"
      />

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{errors.form}</p>
      )}
      {notice && <Notice>{notice}</Notice>}

      <Button type="submit" loading={saving} disabled={!changed} className="self-start">
        Save changes
      </Button>
    </form>
  );
}

function PasswordForm() {
  const isPreview = usePreview();
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!form.currentPassword) newErrors.currentPassword = "Enter your current password";
    if (form.newPassword.length < 8) newErrors.newPassword = "Password must contain at least 8 characters";
    else if (form.newPassword === form.currentPassword) newErrors.newPassword = "Choose a password you haven't used here";
    if (form.confirmPassword !== form.newPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      await changePassword(form);
      setForm(empty);
      setNotice(isPreview ? "Looks good. When this is live, your password will change." : "Password changed");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
      <div>
        <h2 className="text-base font-extrabold">Password</h2>
        <p className="text-sm text-mute">Use at least 8 characters.</p>
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
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{errors.form}</p>
      )}
      {notice && <Notice>{notice}</Notice>}

      <Button type="submit" loading={saving} className="self-start">
        Change password
      </Button>
    </form>
  );
}

function AccountDetails({ user }) {
  const rows = [
    ["Full name", user.name],
    ["Username", user.username],
    ["Email address", user.email],
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
      <h2 className="text-base font-extrabold">Account details</h2>
      <dl className="flex flex-col divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-2 py-2.5 text-sm">
            <dt className="text-mute">{label}</dt>
            <dd className="font-semibold">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const displayName = user.name || user.username || user.email;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={displayName} id={user.id} size="size-14" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="text-sm text-mute">
            {user.email || "No email on file"}
            {user.id && ` · User ID ${user.id}`}
          </p>
        </div>
      </div>

      <FeatureGate
        feature="profileEditing"
        fallback={(peek) => (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <AccountDetails user={user} />
            <ComingSoon feature="profileEditing" onPeek={peek} />
          </div>
        )}
      >
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <DetailsForm user={user} onSaved={updateUser} />
          <PasswordForm />
        </div>

        <p className="text-xs text-mute">
          Profile changes are mocked: they show straight away but are lost when
          you reload, until the backend has endpoints to update your account.
        </p>
      </FeatureGate>
    </div>
  );
}
