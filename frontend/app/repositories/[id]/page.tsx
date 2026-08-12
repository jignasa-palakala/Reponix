"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Source = {
  file_path?: string;
  content?: string;
  score?: number;
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
  }[];
};

export default function RepositoryChat() {
  const params = useParams();
  const repositoryId = Number(params.id);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadConversations();
  }, []);

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

  // Open the source-code viewer
  function openSource(filePath: string) {
    const encodedPath = encodeURIComponent(filePath);

    window.location.href =
      `/repositories/${repositoryId}/file?path=${encodedPath}`;
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

      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-r border-gray-800 bg-gray-900">

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

      {/* Main chat */}
      <section className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold">
            Repository Chat
          </h2>

          <p className="text-sm text-gray-500">
            Ask questions about your codebase
          </p>
        </header>

        {/* Messages */}
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

                {/* Message */}
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

                              {/* Clickable file name */}
                              {source.file_path ? (
                                <button
                                  onClick={() =>
                                    openSource(
                                      source.file_path!
                                    )
                                  }
                                  className="text-left text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  📄 {source.file_path}
                                </button>
                              ) : (
                                <p className="text-sm font-medium text-gray-400">
                                  Source{" "}
                                  {sourceIndex + 1}
                                </p>
                              )}

                              {/* Relevance score */}
                              {source.score !== undefined && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Relevance:{" "}
                                  {source.score.toFixed(3)}
                                </p>
                              )}

                              {/* Code snippet */}
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

        {/* Input */}
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