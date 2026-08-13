"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadFiles();
    loadConversations();
  }, []);

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
      console.error(
        "Failed to load conversations:",
        error
      );
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
      console.error(
        "Failed to load conversation:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setQuestion("");
  }

  function openFile(filePath: string) {
    window.location.href =
      `/repositories/${repositoryId}/file?path=${encodeURIComponent(
        filePath
      )}`;
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

  /*
   * Convert the flat file list from the backend into
   * a nested folder structure.
   */
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

          const isExpanded =
            expandedFolders.has(folderPath);

          return (
            <div key={folderPath}>
              <button
                onClick={() =>
                  toggleFolder(folderPath)
                }
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800"
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
            onClick={() =>
              openFile(file.file_path)
            }
            className="flex w-full items-center gap-2 rounded-md py-1.5 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
            style={{
              paddingLeft: `${22 + depth * 14}px`,
            }}
          >
            <span>📄</span>

            <span className="truncate">
              {file.file_name}
            </span>
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
        throw new Error(
          data.detail || "Chat request failed"
        );
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
    <main className="flex min-h-screen bg-gray-950 text-white">

      {/* Conversations sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900">

        <div className="border-b border-gray-800 p-5">
          <h1 className="text-xl font-bold">
            Reponix
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Repository #{repositoryId}
          </p>
        </div>

        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-700"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3">

          <p className="px-2 py-2 text-xs font-semibold uppercase text-gray-500">
            Conversations
          </p>

          {loadingConversations ? (
            <p className="px-2 py-3 text-sm text-gray-500">
              Loading...
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-3 text-sm text-gray-500">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() =>
                    loadConversation(conversation.id)
                  }
                  className={`w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-gray-800 ${
                    conversation.id === conversationId
                      ? "bg-gray-800"
                      : ""
                  }`}
                >
                  <div className="truncate font-medium">
                    {conversation.title}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(
                      conversation.created_at
                    ).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 p-4">

          <button
            onClick={() =>
              (window.location.href = "/dashboard")
            }
            className="mb-2 w-full rounded-lg px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ← Dashboard
          </button>

          <button
            onClick={logout}
            className="w-full rounded-lg px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Logout
          </button>

        </div>

      </aside>

      {/* Repository files */}
      <aside className="hidden w-72 flex-col border-r border-gray-800 bg-gray-950 lg:flex">

        <div className="border-b border-gray-800 p-5">
          <h2 className="font-semibold">
            Repository Files
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {files.length} indexed files
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">

          {loadingFiles ? (
            <p className="p-3 text-sm text-gray-500">
              Loading files...
            </p>
          ) : files.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">
              No files found.
            </p>
          ) : (
            renderTree(fileTree)
          )}

        </div>

      </aside>

      {/* Main chat */}
      <section className="flex min-w-0 flex-1 flex-col">

        <header className="border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold">
            Repository Chat
          </h2>

          <p className="text-sm text-gray-500">
            Ask questions about your codebase
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">

          <div className="mx-auto max-w-4xl space-y-6">

            {messages.length === 0 && (
              <div className="py-20 text-center">

                <h2 className="text-3xl font-semibold">
                  Ask your repository anything
                </h2>

                <p className="mt-3 text-gray-400">
                  Reponix will search the code and explain it.
                </p>

              </div>
            )}

            {messages.map((message, index) => (
              <div key={index}>

                <div
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-2xl rounded-2xl bg-blue-600 p-4"
                      : "mr-auto max-w-3xl rounded-2xl border border-gray-800 bg-gray-900 p-4"
                  }
                >

                  <div className="mb-2 text-xs font-semibold uppercase text-gray-400">
                    {message.role === "user"
                      ? "You"
                      : "Reponix AI"}
                  </div>

                  <div className="whitespace-pre-wrap leading-7">
                    {message.content}
                  </div>

                </div>

                {/* Sources */}
                {message.role === "assistant" &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="mr-auto mt-3 max-w-3xl rounded-xl border border-gray-800 bg-gray-900/50 p-4">

                      <p className="mb-3 text-sm font-semibold text-gray-300">
                        Sources
                      </p>

                      <div className="space-y-2">

                        {message.sources.map(
                          (source, sourceIndex) => (
                            <div
                              key={sourceIndex}
                              className="rounded-lg border border-gray-800 bg-gray-950 p-3"
                            >

                              {source.file_path ? (
                                <button
                                  onClick={() =>
                                    openFile(
                                      source.file_path!
                                    )
                                  }
                                  className="text-left text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  📄 {source.file_path}
                                </button>
                              ) : (
                                <p className="text-sm text-gray-400">
                                  Source{" "}
                                  {sourceIndex + 1}
                                </p>
                              )}

                              {source.distance !== undefined && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Distance:{" "}
                                  {source.distance.toFixed(3)}
                                </p>
                              )}

                              {source.content && (
                                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-gray-500">
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
              <div className="mr-auto rounded-2xl border border-gray-800 bg-gray-900 p-4 text-gray-400">
                Reponix is thinking...
              </div>
            )}

          </div>

        </div>

        <div className="border-t border-gray-800 bg-gray-950 p-4">

          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-4xl gap-3"
          >

            <input
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask about this repository..."
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={
                loading || !question.trim()
              }
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send"}
            </button>

          </form>

        </div>

      </section>

    </main>
  );
}