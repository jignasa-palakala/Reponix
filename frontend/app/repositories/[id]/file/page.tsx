"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type FileData = {
  id: number;
  file_name: string;
  file_path: string;
  language: string;
  size: number;
  content: string;
};

export default function FileViewer() {
  const params = useParams();
  const searchParams = useSearchParams();

  const repositoryId = Number(params.id);
  const filePath = searchParams.get("path");

  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFile() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      if (!filePath) {
        setError("No file specified.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/repositories/${repositoryId}/file?path=${encodeURIComponent(filePath)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load file"
          );
        }

        setFile(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load file"
        );
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [repositoryId, filePath]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto max-w-7xl">

          <button
            onClick={() =>
              (window.location.href =
                `/repositories/${repositoryId}`)
            }
            className="mb-3 text-sm text-gray-400 hover:text-white"
          >
            ← Back to Chat
          </button>

          {file && (
            <div>
              <h1 className="text-xl font-semibold">
                {file.file_name}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {file.file_path}
              </p>
            </div>
          )}

        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">

        {loading && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
            Loading file...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950 p-6 text-red-300">
            {error}
          </div>
        )}

        {file && !loading && (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">

            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">

              <span className="text-sm text-gray-400">
                {file.language}
              </span>

              <span className="text-xs text-gray-500">
                {file.size} bytes
              </span>

            </div>

            <pre className="overflow-x-auto p-6 text-sm leading-6">
              <code>{file.content}</code>
            </pre>

          </div>
        )}

      </div>
    </main>
  );
}