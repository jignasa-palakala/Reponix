"use client";

import { FormEvent, useEffect, useState } from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";

type Repository = {
  id: number;
  repo_name: string;
  repo_url: string;
  status: string;
  created_at: string;
};

const cardSurface =
  "rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow)]";

const panelSurface =
  "rounded-2xl border border-[var(--card-border)] bg-[var(--panel-bg)]";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Repository | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadRepositories() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/repositories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load repositories");
        }

        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error("Failed to load repositories:", error);
      } finally {
        setLoading(false);
      }
    }

    async function loadUser() {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const response = await fetch("http://127.0.0.1:8000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }

    loadRepositories();
    loadUser();
  }, []);

  async function handleCreateRepository(event: FormEvent) {
    event.preventDefault();

    const repoUrl = newRepoUrl.trim();

    if (!repoUrl) {
      setCreateError("Please enter a GitHub repository URL.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Repository could not be added");
      }

      setRepositories((previous) => [data, ...previous]);
      setNewRepoUrl("");
      setIsCreateModalOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Repository could not be added."
      );
    } finally {
      setCreating(false);
    }
  }

  async function confirmDeleteRepository() {
    if (!deleteTarget) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/repositories/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete repository");
      }

      setRepositories((previous) =>
        previous.filter((repository) => repository.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete repository:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete repository."
      );
    } finally {
      setDeleting(false);
    }
  }

  function openChat(repositoryId: number) {
    window.location.href = `/repositories/${repositoryId}`;
  }

  function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  }

  const getStatusMeta = (status: string) => {
    switch (status) {
      case "ready":
        return {
          badge: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
          label: "Indexed",
        };
      case "failed":
        return {
          badge: "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
          label: "Failed",
        };
      case "indexing":
        return {
          badge: "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
          label: "Indexing",
        };
      default:
        return {
          badge: "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/40 dark:bg-slate-700/40 dark:text-slate-200",
          label: "Pending",
        };
    }
  };

  return (
    <>
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
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <span className="text-base leading-none">＋</span>
                Add Repository
              </button>

              <ThemeToggle />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--shadow)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                  title={userEmail}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Account</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg">
                    <div className="border-b border-[var(--card-border)] px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                        Account
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
                        {userEmail}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/profile";
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--sidebar-bg)] hover:text-[var(--foreground)]"
                    >
                      Profile Settings
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full border-t border-[var(--card-border)] px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50/50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Workspace
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">Your repositories</h2>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:brightness-110"
            >
              <span className="text-base leading-none">＋</span>
              Add Repository
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className={`${cardSurface} animate-pulse p-5`}>
                  <div className="mb-4 h-10 w-10 rounded-xl bg-[var(--sidebar-bg)]" />
                  <div className="mb-3 h-5 w-2/3 rounded bg-[var(--sidebar-bg)]" />
                  <div className="mb-6 h-4 w-full rounded bg-[var(--sidebar-bg)]" />
                  <div className="h-11 rounded-xl bg-[var(--sidebar-bg)]" />
                </div>
              ))}
            </div>
          ) : repositories.length === 0 ? (
            <div className={`${panelSurface} px-6 py-16 text-center`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sidebar-bg)] text-[var(--text-secondary)]">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold">No repositories yet</h3>
              <p className="mx-auto mt-2 max-w-md text-[var(--text-secondary)]">
                Add a GitHub repository to start exploring and chatting with your codebase.
              </p>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:brightness-110"
              >
                <span className="text-base leading-none">＋</span>
                Add Repository
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {repositories.map((repo) => {
                const statusMeta = getStatusMeta(repo.status);

                return (
                  <div
                    key={repo.id}
                    className={`${cardSurface} group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]`}
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7h8M8 12h8M8 17h5M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                            />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[var(--foreground)]">
                            {repo.repo_name}
                          </h3>
                          <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">
                            {repo.repo_url.replace(/^https?:\/\//i, "")}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={`Delete repository ${repo.repo_name}`}
                        title="Delete repository"
                        onClick={() => setDeleteTarget(repo)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 shadow-sm transition hover:from-amber-200 hover:to-orange-200 hover:text-amber-800 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-300 dark:hover:from-amber-500/15 dark:hover:to-orange-500/15"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 6h18M8 6V4h8v2m-9 0l1 13h8l1-13"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>

                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        Added {formatDate(repo.created_at)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--card-border)] pt-4">
                      <div className="text-left text-[11px] text-[var(--text-secondary)]">
                        <div className="font-medium text-[var(--foreground)]">
                          {repo.status === "ready"
                            ? "Ready for chat"
                            : repo.status === "indexing"
                              ? "Indexing in progress"
                              : "Waiting to index"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openChat(repo.id)}
                        disabled={repo.status !== "ready"}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          repo.status === "ready"
                            ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-[var(--shadow)] hover:brightness-110"
                            : "cursor-not-allowed bg-[var(--sidebar-bg)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        Open
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-repo-title"
            className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-lg)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Repository
                </p>
                <h3 id="add-repo-title" className="mt-2 text-2xl font-semibold">
                  Add Repository
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--sidebar-bg)] hover:text-[var(--foreground)]"
                aria-label="Close repository modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRepository} className="space-y-4">
              <div>
                <label htmlFor="repo-url" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  GitHub Repository URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  value={newRepoUrl}
                  onChange={(event) => setNewRepoUrl(event.target.value)}
                  disabled={creating}
                  placeholder="https://github.com/owner/repository"
                  className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-3 text-[var(--foreground)] placeholder-[var(--text-tertiary)] transition focus:border-[var(--input-focus)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError("");
                    setNewRepoUrl("");
                  }}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--sidebar-bg)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || !newRepoUrl.trim()}
                  className="rounded-xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Adding..." : "Add Repository"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-repo-title"
            className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-lg)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Remove
                </p>
                <h3 id="delete-repo-title" className="mt-2 text-2xl font-semibold">
                  Delete Repository?
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-300">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 6h18M8 6V4h8v2m-9 0l1 13h8l1-13"
                  />
                </svg>
              </div>
            </div>

            <p className="text-[var(--text-secondary)]">
              Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">{deleteTarget.repo_name}</span>? This will remove the repository and its indexed data.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--sidebar-bg)]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteRepository}
                className="rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}