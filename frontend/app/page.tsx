"use client";

import { FormEvent, useState } from "react";
import { ThemeToggle } from "./components/theme-toggle";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);

      setMessage("Redirecting...");
      setMessageType("success");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Login failed";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Login container */}
      <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Reponix
            </h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              AI-Powered Repository Intelligence
            </p>
            <p className="mt-1 text-[var(--text-tertiary)] text-sm">
              Chat with your codebase, powered by AI
            </p>
          </div>

          {/* Login form */}
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-lg p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                  placeholder="name@example.com"
                />
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 hover:brightness-110 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Message display */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg border ${
                  messageType === "error"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                }`}
              >
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
              <p className="text-xs text-[var(--text-tertiary)] text-center mb-3">
                Demo credentials:
              </p>
              <div className="space-y-2 text-xs text-[var(--text-tertiary)]">
                <p className="font-mono bg-[var(--sidebar-bg)] p-2 rounded">
                  📧 Email: user@example.com
                </p>
                <p className="font-mono bg-[var(--sidebar-bg)] p-2 rounded">
                  🔑 Password: password123
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-[var(--text-tertiary)] text-sm">
            Powered by advanced AI technology
          </p>
        </div>
      </div>
    </main>
  );
}