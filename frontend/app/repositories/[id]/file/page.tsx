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
  const [copied, setCopied] = useState(false);

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
          `http://127.0.0.1:8000/api/repositories/${repositoryId}/file?path=${encodeURIComponent(
            filePath
          )}`,
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

  async function copyCode() {
    if (!file) return;

    try {
      await navigator.clipboard.writeText(file.content);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Failed to copy code.");
    }
  }

  const lines = file?.content.split("\n") ?? [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
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
            <div className="flex items-center justify-between gap-4">

              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">
                  {file.file_name}
                </h1>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {file.file_path}
                </p>
              </div>

              <button
                onClick={copyCode}
                className="shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
              >
                {copied ? "✓ Copied" : "Copy Code"}
              </button>

            </div>
          )}

        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-6">

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
            Loading file...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950 p-6 text-red-300">
            {error}
          </div>
        )}

        {/* File */}
        {file && !loading && !error && (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">

            {/* File information */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">

              <div className="flex items-center gap-3">
                <span className="rounded-md bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                  {file.language}
                </span>

                <span className="text-xs text-gray-500">
                  {file.file_path}
                </span>
              </div>

              <span className="text-xs text-gray-500">
                {file.size.toLocaleString()} bytes
              </span>

            </div>

            {/* Code viewer */}
            <div className="overflow-x-auto">

              <div className="flex min-w-max">

                {/* Line numbers */}
                <div className="select-none border-r border-gray-800 bg-gray-950 px-4 py-6 text-right font-mono text-sm leading-6 text-gray-600">

                  {lines.map((_, index) => (
                    <div key={index}>
                      {index + 1}
                    </div>
                  ))}

                </div>

                {/* Code */}
                <pre className="p-6 font-mono text-sm leading-6 text-gray-200">
                  <code>{file.content}</code>
                </pre>

              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}