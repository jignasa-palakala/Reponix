"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";

type User = {
  id: number;
  email: string;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeMessage, setChangeMessage] = useState("");
  const [changeMessageType, setChangeMessageType] = useState<
    "error" | "success" | ""
  >("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load user");
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setChangeMessage("New passwords do not match");
      setChangeMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setChangeMessage("Password must be at least 8 characters");
      setChangeMessageType("error");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setChanging(true);
    setChangeMessage("");
    setChangeMessageType("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Failed to change password");
      }

      setChangeMessage("Password changed successfully");
      setChangeMessageType("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setChangeMessage("");
        setChangeMessageType("");
      }, 3000);
    } catch (error) {
      setChangeMessage(
        error instanceof Error ? error.message : "Failed to change password"
      );
      setChangeMessageType("error");
    } finally {
      setChanging(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  }

  const memberSince = user
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-[var(--shadow)]">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4m0 6V4m0 0L8 4m6 16l-4-4"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Reponix</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Repository Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => (window.location.href = "/dashboard")}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight">Account Settings</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Manage your account and preferences
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-1/2 rounded bg-[var(--sidebar-bg)]" />
              <div className="h-4 w-full rounded bg-[var(--sidebar-bg)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--sidebar-bg)]" />
            </div>
          </div>
        ) : user ? (
          <div className="space-y-8">
            {/* Profile section */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow)]">
              <div className="mb-8">
                <h3 className="text-xl font-semibold">Profile Information</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Your account details
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Email Address
                  </label>
                  <div className="mt-2 rounded-lg bg-[var(--panel-bg)] px-4 py-3">
                    <p className="font-medium text-[var(--foreground)]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Member Since
                  </label>
                  <div className="mt-2 rounded-lg bg-[var(--panel-bg)] px-4 py-3">
                    <p className="text-[var(--foreground)]">{memberSince}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Account ID
                  </label>
                  <div className="mt-2 rounded-lg bg-[var(--panel-bg)] px-4 py-3">
                    <p className="font-mono text-sm text-[var(--text-tertiary)]">
                      #{user.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change password section */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow)]">
              <div className="mb-8">
                <h3 className="text-xl font-semibold">Change Password</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Update your password to keep your account secure
                </p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-[var(--foreground)] mb-2"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      disabled={changing}
                      className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 pr-12 text-[var(--foreground)] placeholder-[var(--text-tertiary)] transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-[var(--foreground)] mb-2"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={changing}
                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-tertiary)] transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-[var(--foreground)] mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    disabled={changing}
                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-tertiary)] transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="••••••••"
                  />
                </div>

                {changeMessage && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      changeMessageType === "error"
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    {changeMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    changing ||
                    !currentPassword.trim() ||
                    !newPassword.trim() ||
                    !confirmPassword.trim()
                  }
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 px-4 py-3 font-semibold text-white shadow-[var(--shadow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changing ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 dark:border-red-500/20 dark:bg-red-500/5">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-300">
                  Danger Zone
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Log out from all devices and sessions
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-lg border border-red-300 bg-red-100 px-4 py-3 font-semibold text-red-700 shadow-sm transition hover:bg-red-200 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
            <p className="text-[var(--text-secondary)]">
              Failed to load account information
            </p>
            <button
              type="button"
              onClick={() => (window.location.href = "/dashboard")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:brightness-110"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
