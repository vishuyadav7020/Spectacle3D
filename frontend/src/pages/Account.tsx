import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { AddressBook } from "../components/account/AddressBook";
import { useAuth } from "../context/AuthContext";
import { changePassword, deleteMe, updateMe } from "../lib/auth";

export function Account() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? "");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setSavingProfile(true);
    try {
      await updateMe({ full_name: fullName, phone_number: phoneNumber || null });
      await refreshUser();
      setProfileMessage("Profile updated successfully.");
    } catch {
      setProfileError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    setSavingPassword(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordMessage("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setPasswordError(err.response.data.error);
      } else {
        setPasswordError("Something went wrong. Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    // Navigate before clearing auth state — see UserMenu.tsx for why the order matters.
    navigate("/");
    await logout();
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteMe();
      navigate("/");
      await logout();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-16">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          My Account
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          {user.email} · {user.total_orders} orders
        </p>

        <section className="mt-10 rounded-lg border border-border bg-surface p-8">
          <h2 className="font-display text-xl font-medium text-text-primary">
            Profile details
          </h2>
          <form onSubmit={handleProfileSubmit} className="mt-6 flex flex-col gap-5">
            <Input
              label="Full name"
              name="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Phone number"
              name="phone_number"
              value={phoneNumber ?? ""}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Input label="Email" name="email" value={user.email} disabled />

            {profileMessage && (
              <p className="font-body text-sm text-success">{profileMessage}</p>
            )}
            {profileError && (
              <p className="font-body text-sm text-accent-warm">{profileError}</p>
            )}

            <Button type="submit" variant="primary" className="w-fit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </section>

        <section className="mt-8 rounded-lg border border-border bg-surface p-8">
          <h2 className="font-display text-xl font-medium text-text-primary">
            Change password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="mt-6 flex flex-col gap-5">
            <Input
              label="Current password"
              type="password"
              name="old_password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <Input
              label="New password"
              type="password"
              name="new_password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            {passwordMessage && (
              <p className="font-body text-sm text-success">{passwordMessage}</p>
            )}
            {passwordError && (
              <p className="font-body text-sm text-accent-warm">{passwordError}</p>
            )}

            <Button type="submit" variant="primary" className="w-fit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </section>

        <AddressBook />

        <section className="mt-8 rounded-lg border border-accent-warm/40 bg-surface p-8">
          <h2 className="font-display text-xl font-medium text-accent-warm">
            Danger zone
          </h2>
          <p className="mt-2 font-body text-sm text-text-secondary">
            Permanently delete your account and all associated data. This
            cannot be undone.
          </p>

          {deleteError && (
            <p className="mt-3 font-body text-sm text-accent-warm">{deleteError}</p>
          )}

          {confirmingDelete ? (
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                className="border-accent-warm text-accent-warm"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete Account
            </Button>
          )}
        </section>

        <Button variant="secondary" className="mt-8" onClick={handleLogout}>
          Logout
        </Button>
      </main>

      <Footer />
    </div>
  );
}
