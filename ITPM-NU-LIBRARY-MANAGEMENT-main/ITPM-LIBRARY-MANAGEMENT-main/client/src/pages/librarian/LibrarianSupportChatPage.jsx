import { useEffect, useMemo, useRef, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import { formatDateTime } from "../../utils/format";
import { useSocketApp } from "../../hooks/useSocketApp";

const resolveAttachmentUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const LibrarianSupportChatPage = () => {
  const INITIAL_VISIBLE_MESSAGES = 1;
  const [messages, setMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MESSAGES);
  const [expandedAttachmentIds, setExpandedAttachmentIds] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [text, setText] = useState("");
  const [selectedMessagePreview, setSelectedMessagePreview] = useState("");
  const [selectedReplyToId, setSelectedReplyToId] = useState("");
  const [file, setFile] = useState(null);
  const { socket } = useSocketApp();
  const messagesContainerRef = useRef(null);

  const loadThreads = () => {
    libraryApi.supportChat.librarianThreads().then(({ data }) => {
      setMessages(data);
      if (!selectedStudentId) {
        const firstStudent = data.find((row) => row.student?._id)?.student?._id;
        if (firstStudent) {
          setSelectedStudentId(firstStudent);
        }
      }
    });
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (payload) => {
      if (payload?.student?._id) {
        setMessages((current) => [...current, payload]);
      }
    };
    socket.on("support-chat:new-message", onMessage);
    return () => socket.off("support-chat:new-message", onMessage);
  }, [socket]);

  const students = useMemo(() => {
    const byId = new Map();
    messages.forEach((msg) => {
      if (msg.student?._id && !byId.has(msg.student._id)) {
        byId.set(msg.student._id, msg.student);
      }
    });
    return Array.from(byId.values());
  }, [messages]);

  const selectedMessages = useMemo(
    () =>
      messages
        .filter((msg) => msg.student?._id === selectedStudentId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages, selectedStudentId]
  );
  const visibleMessages = useMemo(
    () => selectedMessages.slice(-visibleCount),
    [selectedMessages, visibleCount]
  );
  const hasMoreMessages = selectedMessages.length > visibleMessages.length;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_MESSAGES);
    setSelectedMessagePreview("");
    setSelectedReplyToId("");
  }, [selectedStudentId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [visibleMessages.length, selectedStudentId]);

  const sendReply = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if ((!message && !file) || !selectedStudentId) return;
    const formData = new FormData();
    if (message) formData.append("message", message);
    if (file) formData.append("file", file);
    if (selectedReplyToId) formData.append("replyTo", selectedReplyToId);
    const { data } = await libraryApi.supportChat.librarianSend(selectedStudentId, formData);
    setMessages((current) => [...current, data]);
    setVisibleCount((current) => Math.max(current, INITIAL_VISIBLE_MESSAGES));
    setText("");
    setSelectedMessagePreview("");
    setSelectedReplyToId("");
    setFile(null);
  };

  const toggleAttachmentPreview = (messageId) => {
    setExpandedAttachmentIds((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }));
  };

  const selectMessageForReply = (msg) => {
    const selectedText = (msg?.message || "").trim();
    if (!selectedText) return;
    setText((current) => (current.trim() ? `${current}\n${selectedText}` : selectedText));
    setSelectedMessagePreview(selectedText);
    setSelectedReplyToId(msg._id);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Student conversations" subtitle="Select a student to view issue chat">
        <div className="space-y-2">
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">No student messages yet.</p>
          ) : (
            students.map((student) => (
              <button
                key={student._id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedStudentId === student._id
                    ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                onClick={() => setSelectedStudentId(student._id)}
              >
                <p className="font-medium">{student.name}</p>
                <p className="text-xs text-slate-500">{student.email}</p>
              </button>
            ))
          )}
        </div>
      </Panel>
      <Panel title="Support chat" subtitle="Respond to student issues">
        <form className="mb-4 flex gap-2" onSubmit={sendReply}>
          <div className="flex w-full flex-col gap-2">
            {selectedMessagePreview ? (
              <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
                Replying to: {selectedMessagePreview}
              </div>
            ) : null}
            <input
              className="input-field"
              placeholder={selectedStudentId ? "Type reply..." : "Select a student first"}
              disabled={!selectedStudentId}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <input
              type="file"
              className="input-field"
              disabled={!selectedStudentId}
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </div>
          <button type="submit" className="btn-primary px-5" disabled={!selectedStudentId}>
            Send
          </button>
        </form>
        <div
          ref={messagesContainerRef}
          className="mb-4 max-h-[460px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          {hasMoreMessages ? (
            <button
              type="button"
              className="mb-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setVisibleCount(selectedMessages.length)}
            >
              View more
            </button>
          ) : null}
          {selectedMessages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages for this student yet.</p>
          ) : (
            visibleMessages.map((msg) => (
              <div
                key={msg._id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.senderRole === "Librarian" ? "bg-indigo-100 text-indigo-900" : "bg-white text-slate-700"
                }`}
                onClick={() => selectMessageForReply(msg)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectMessageForReply(msg);
                  }
                }}
              >
                <p className="font-medium">{msg.sender?.name || msg.senderRole}</p>
                {msg.replyTo?.message ? (
                  <p className="mb-1 rounded border-l-2 border-indigo-300 bg-indigo-50 px-2 py-1 text-xs text-indigo-800">
                    Reply to {msg.replyTo.sender?.name || msg.replyTo.senderRole}: {msg.replyTo.message}
                  </p>
                ) : null}
                {msg.message ? <p>{msg.message}</p> : null}
                {msg.attachment?.url ? (
                  <div className="mt-2">
                    {String(msg.attachment.mimeType || "").startsWith("image/") ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          onClick={() => toggleAttachmentPreview(msg._id)}
                        >
                          {expandedAttachmentIds[msg._id] ? "Hide" : "View more"}
                        </button>
                        {expandedAttachmentIds[msg._id] ? (
                          <img
                            src={resolveAttachmentUrl(msg.attachment.url)}
                            alt={msg.attachment.fileName || "attachment"}
                            className="max-h-44 rounded-md border border-slate-200"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <a
                        href={resolveAttachmentUrl(msg.attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-indigo-700 underline"
                      >
                        Open attachment: {msg.attachment.fileName || "file"}
                      </a>
                    )}
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(msg.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
};

export default LibrarianSupportChatPage;
