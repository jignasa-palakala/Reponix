"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";

type RepositoryFile = {
  id: number;
  repository_id: number;
  file_name: string;
  file_path: string;
  language: string;
  size: number;
};

type Source = {
  file_path?: string;
  content?: string;
  distance?: number;
  start_line?: number;
  end_line?: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

type Conversation = {
  id: number;
  repository_id: number;
  title: string;
  created_at: string;
};

type ConversationDetail = {
  id: number;
  repository_id: number;
  title: string;
  created_at: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
  }[];
};

type FileTree = {
  folders: Record<string, FileTree>;
  files: RepositoryFile[];
};

export default function RepositoryChat() {
  const params = useParams();
  const repositoryId = Number(params.id);

  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [repositoryName, setRepositoryName] = useState("Repository");

  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [expandedFolders, setExpandedFolders] = useState<
    Set<string>
  >(new Set());

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadRepositoryMeta();
    loadFiles();
    loadConversations();
  }, []);

  async function loadRepositoryMeta() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/repositories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const foundRepository = data.find(
        (repo: { id: number; repo_name: string }) => repo.id === repositoryId
      );

      if (foundRepository?.repo_name) {
        setRepositoryName(foundRepository.repo_name);
      }
    } catch (error) {
      console.error("Failed to load repository metadata:", error);
    }
  }

  async function loadFiles() {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/repositories/${repositoryId}/files`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load repository files");
      }

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function loadConversations() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/chat/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();

      const repositoryConversations = data.filter(
        (conversation: Conversation) =>
          conversation.repository_id === repositoryId
      );

      setConversations(repositoryConversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadConversation(id: number) {
    try {
      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/api/chat/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const data: ConversationDetail =
        await response.json();

      setConversationId(data.id);

      setMessages(
        data.messages.map((message) => ({
          role: message.role,
          content: message.content,
          sources: message.sources || [],
        }))
      );
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setQuestion("");
  }

  function openFile(
    filePath: string,
    startLine?: number,
    endLine?: number
  ) {
    const searchParams = new URLSearchParams();

    searchParams.set("path", filePath);

    if (startLine !== undefined) {
      searchParams.set("start", String(startLine));
    }

    if (endLine !== undefined) {
      searchParams.set("end", String(endLine));
    }

    window.location.href =
      `/repositories/${repositoryId}/file?${searchParams.toString()}`;
  }

  function toggleFolder(path: string) {
    setExpandedFolders((previous) => {
      const next = new Set(previous);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }

  const fileTree = useMemo(() => {
    const root: FileTree = {
      folders: {},
      files: [],
    };

    for (const file of files) {
      const parts = file.file_path
        .replaceAll("\\", "/")
        .split("/")
        .filter(Boolean);

      let current = root;

      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];

        if (!current.folders[folderName]) {
          current.folders[folderName] = {
            folders: {},
            files: [],
          };
        }

        current = current.folders[folderName];
      }

      current.files.push(file);
    }

    return root;
  }, [files]);

  function renderTree(
    tree: FileTree,
    parentPath = "",
    depth = 0
  ): React.ReactNode {
    const folders = Object.keys(tree.folders).sort(
      (a, b) => a.localeCompare(b)
    );

    const sortedFiles = [...tree.files].sort((a, b) =>
      a.file_name.localeCompare(b.file_name)
    );

    return (
      <div>
        {folders.map((folderName) => {
          const folderPath = parentPath
            ? `${parentPath}/${folderName}`
            : folderName;

          const isExpanded = expandedFolders.has(folderPath);

          return (
            <div key={folderPath}>
              <button
                onClick={() => toggleFolder(folderPath)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--sidebar-bg)] hover:text-[var(--foreground)]"
                style={{
                  paddingLeft: `${8 + depth * 14}px`,
                }}
              >
                <span className="w-4 text-xs">
                  {isExpanded ? "▼" : "▶"}
                </span>

                <span>
                  {isExpanded ? "📂" : "📁"}
                </span>

                <span className="truncate">
                  {folderName}
                </span>
              </button>

              {isExpanded && (
                <div>
                  {renderTree(
                    tree.folders[folderName],
                    folderPath,
                    depth + 1
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sortedFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => openFile(file.file_path)}
            className="flex w-full items-center gap-2 rounded-md py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--sidebar-bg)] hover:text-[var(--foreground)]"
            style={{
              paddingLeft: `${22 + depth * 14}px`,
            }}
          >
            <span>📄</span>

            <span className="truncate">{file.file_name}</span>
          </button>
        ))}
      </div>
    );
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    if (!question.trim() || loading) return;

    if (!token) {
      window.location.href = "/";
      return;
    }

    const userQuestion = question;

    setQuestion("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            repository_id: repositoryId,
            conversation_id: conversationId,
            question: userQuestion,
            top_k: 5,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Chat request failed");
      }

      setConversationId(data.conversation_id);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);

      await loadConversations();
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Conversations sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } flex h-screen flex-col border-r border-[var(--card-border)] bg-[var(--card-bg)] transition-all duration-300 overflow-hidden`}
      >
        <div className="border-b border-[var(--card-border)] p-5">
          <h1 className="text-lg font-bold">Reponix</h1>

          <p className="mt-2 truncate text-sm font-medium text-[var(--foreground)]">
            {repositoryName}
          </p>
        </div>

        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full rounded-lg bg-gradient-to-r from-[#62d2c6] via-[#4bb8c6] to-[#2f9ec3] px-4 py-3 font-semibold text-white shadow-lg shadow-[rgba(75,184,198,0.25)] transition-all hover:brightness-110"
          >
            + New Chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <p className="px-2 py-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">
            Conversations
          </p>

          {loadingConversations ? (
            <p className="px-2 py-3 text-sm text-[var(--text-secondary)]">
              Loading...
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[var(--text-secondary)]">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => loadConversation(conversation.id)}
                  className={`w-full rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                    conversation.id === conversationId
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--sidebar-bg)] text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="truncate font-medium">
                    {conversation.title}
                  </div>

                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {new Date(
                      conversation.created_at
                    ).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--card-border)] p-4 space-y-2">
          <ThemeToggle />
          <button
            onClick={() =>
              (window.location.href = "/dashboard")
            }
            className="w-full rounded-lg px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--sidebar-bg)] transition-colors"
          >
            ← Dashboard
          </button>

          <button
            onClick={logout}
            className="w-full rounded-lg px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--sidebar-bg)] transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Repository files sidebar */}
      <aside className="hidden w-72 flex-col border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] lg:flex">
        <div className="border-b border-[var(--card-border)] p-5">
          <h2 className="font-semibold">Repository Files</h2>

          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {files.length} indexed files
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loadingFiles ? (
            <p className="p-3 text-sm text-[var(--text-secondary)]">
              Loading files...
            </p>
          ) : files.length === 0 ? (
            <p className="p-3 text-sm text-[var(--text-secondary)]">
              No files found.
            </p>
          ) : (
            renderTree(fileTree)
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-4 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mb-2 p-2 hover:bg-[var(--sidebar-bg)] rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h2 className="text-xl font-semibold">Chat with Repository</h2>

          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Ask questions about your codebase - AI will search and explain
          </p>
        </header>

        {/* Messages area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#62d2c6] via-[#4bb8c6] to-[#2f9ec3] rounded-full mb-4">
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>

                <h2 className="text-3xl font-semibold mb-2">
                  Ask Your Repository Anything
                </h2>

                <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                  Describe what you want to know about your code, and Reponix will search through your repository and provide AI-powered insights.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-2xl rounded-2xl bg-gradient-to-r from-[#62d2c6] via-[#4bb8c6] to-[#2f9ec3] text-white p-4 shadow-lg shadow-[rgba(75,184,198,0.25)]"
                      : "mr-auto max-w-3xl rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-md"
                  }
                >
                  <div className="mb-2 text-xs font-semibold uppercase text-opacity-70">
                    {message.role === "user"
                      ? "You"
                      : "Reponix AI"}
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </div>

                {/* Sources */}
                {message.role === "assistant" &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="mr-auto mt-4 max-w-3xl rounded-xl border border-[var(--card-border)] bg-[var(--sidebar-bg)] p-5">
                      <p className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                        📚 Sources
                      </p>

                      <div className="space-y-3">
                        {message.sources.map(
                          (source, sourceIndex) => (
                            <div
                              key={sourceIndex}
                              className="rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] p-3 hover:border-[var(--accent)] transition-colors"
                            >
                              {source.file_path ? (
                                <button
                                  onClick={() =>
                                    openFile(
                                      source.file_path!,
                                      source.start_line,
                                      source.end_line
                                    )
                                  }
                                  className="text-sm font-medium text-[var(--accent)] hover:underline text-left"
                                >
                                  📄 {source.file_path}
                                </button>
                              ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                  Source {sourceIndex + 1}
                                </p>
                              )}

                              {source.start_line !==
                                undefined &&
                                source.end_line !==
                                  undefined && (
                                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                    📍 Lines {source.start_line}–
                                    {source.end_line}
                                  </p>
                                )}

                              {source.distance !==
                                undefined && (
                                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                  🎯 Relevance:{" "}
                                  {(
                                    1 -
                                    source.distance
                                  ).toFixed(1)}
                                </p>
                              )}

                              {source.content && (
                                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-[var(--text-secondary)] bg-[var(--sidebar-bg)] p-2 rounded">
                                  {source.content}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {loading && (
              <div className="mr-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
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
                  Reponix is thinking...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-3xl gap-3"
          >
            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask about your code... (e.g., 'How does authentication work?')"
              disabled={loading}
              className="flex-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-xl bg-gradient-to-r from-[#62d2c6] via-[#4bb8c6] to-[#2f9ec3] px-6 py-3 font-semibold text-white shadow-lg shadow-[rgba(75,184,198,0.25)] transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                Send
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.488 5.951 1.488a1 1 0 001.169-1.409l-7-14z" />
                </svg>
              </span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
