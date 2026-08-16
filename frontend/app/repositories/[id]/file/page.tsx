"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";

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

  const startLine = searchParams.get("start")
    ? Number(searchParams.get("start"))
    : null;

  const endLine = searchParams.get("end")
    ? Number(searchParams.get("end"))
    : null;

  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const highlightRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
          throw new Error(data.detail || "Failed to load file");
        }

        setFile(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load file"
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy code.");
    }
  }

  const lines = file?.content.split("\n") ?? [];

  const isHighlighted = (lineNumber: number) => {
    if (startLine === null || endLine === null) {
      return false;
    }

    return lineNumber >= startLine && lineNumber <= endLine;
  };

  useEffect(() => {
    if (
      startLine === null ||
      endLine === null ||
      !highlightRefs.current[startLine]
    ) {
      return;
    }

    highlightRefs.current[startLine]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [startLine, endLine, file]);

  const languageColors: Record<string, string> = {
    python: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    javascript: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    typescript: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    jsx: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    tsx: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    json: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    markdown: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => (window.location.href = `/repositories/${repositoryId}`)}
            className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Chat
          </button>

          {file && (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="truncate text-2xl font-semibold">{file.file_name}</h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      languageColors[file.language.toLowerCase()] ||
                      "bg-[var(--sidebar-bg)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {file.language}
                  </span>
                </div>

                <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                  {file.file_path}
                </p>

                {startLine !== null && endLine !== null && (
                  <p className="mt-2 text-sm font-medium text-[var(--accent-strong)]">
                    ✨ Highlighting lines {startLine}–{endLine}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--sidebar-bg)]"
                >
                  {copied ? (
                    <>
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        {loading && (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center text-[var(--text-secondary)]">
            <svg
              className="mx-auto mb-3 h-8 w-8 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading file...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <p className="font-semibold">Error loading file</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {file && !loading && !error && (
          <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] px-6 py-3">
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                <span>{file.size.toLocaleString()} bytes</span>
                <span>•</span>
                <span>{lines.length} lines</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex min-w-max">
                <div className="select-none border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] px-4 py-6 text-right font-mono text-sm leading-6 text-[var(--text-tertiary)]">
                  {lines.map((_, index) => {
                    const lineNumber = index + 1;
                    const highlighted = isHighlighted(lineNumber);

                    return (
                      <div
                        key={index}
                        className={`h-6 ${
                          highlighted
                            ? "bg-blue-500/20 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                            : ""
                        }`}
                      >
                        {lineNumber}
                      </div>
                    );
                  })}
                </div>

                <pre className="flex-1 overflow-auto p-6 font-mono text-sm leading-6 text-[var(--foreground)]">
                  {lines.map((line, index) => {
                    const lineNumber = index + 1;
                    const highlighted = isHighlighted(lineNumber);

                    return (
                      <div
                        key={index}
                        ref={(element) => {
                          if (highlighted) {
                            highlightRefs.current[lineNumber] = element;
                          }
                        }}
                        className={
                          highlighted
                            ? "bg-[rgba(75,184,198,0.18)] ring-1 ring-[rgba(75,184,198,0.35)]"
                            : ""
                        }
                      >
                        <code>{line || " "}</code>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}