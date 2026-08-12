"use client";

import { useEffect, useState } from "react";

type Repository = {
  id: number;
  repo_name: string;
  repo_url: string;
  status: string;
};

export default function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepositories() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/repositories",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRepositories(data);
        }
      } catch (error) {
        console.error("Failed to load repositories:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRepositories();
  }, []);

  function openChat(repositoryId: number) {
    window.location.href = `/repositories/${repositoryId}`;
  }

  function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reponix</h1>

            <p className="mt-2 text-gray-400">
              Your repositories
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
          >
            Logout
          </button>
        </header>

        {/* Repository section */}
        <section>
          <h2 className="mb-5 text-2xl font-semibold">
            Your Repositories
          </h2>

          {loading ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <p className="text-gray-400">
                Loading repositories...
              </p>
            </div>
          ) : repositories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-10 text-center">
              <p className="text-gray-400">
                No repositories found.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Add a repository to start chatting with your code.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {repo.repo_name}
                      </h3>

                      <p className="mt-2 break-all text-sm text-gray-400">
                        {repo.repo_url}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        repo.status === "ready"
                          ? "bg-green-900 text-green-300"
                          : repo.status === "failed"
                            ? "bg-red-900 text-red-300"
                            : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {repo.status}
                    </span>
                  </div>

                  <button
                    onClick={() => openChat(repo.id)}
                    disabled={repo.status !== "ready"}
                    className="mt-5 rounded-lg bg-blue-600 px-5 py-2 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Open Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}