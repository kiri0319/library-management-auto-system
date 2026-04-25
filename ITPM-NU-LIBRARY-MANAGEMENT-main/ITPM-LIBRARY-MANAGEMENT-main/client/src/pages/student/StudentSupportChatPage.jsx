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

const StudentSupportChatPage = () => {
  const INITIAL_VISIBLE_MESSAGES = 1;
  const [messages, setMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MESSAGES);
  const [expandedAttachmentIds, setExpandedAttachmentIds] = useState({});
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const { socket } = useSocketApp();
  const messagesContainerRef = useRef(null);

  const loadThread = () => {
    libraryApi.supportChat.studentThread().then(({ data }) => setMessages(data));
  };

  useEffect(() => {
    loadThread();
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

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages]
  );
  const visibleMessages = useMemo(
    () => sortedMessages.slice(-visibleCount),
    [sortedMessages, visibleCount]
  );
  const hasMoreMessages = sortedMessages.length > visibleMessages.length;

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [visibleMessages.length]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message && !file) return;
    const formData = new FormData();
    if (message) formData.append("message", message);
    if (file) formData.append("file", file);
    const { data } = await libraryApi.supportChat.studentSend(formData);
    setMessages((current) => [...current, data]);
    setVisibleCount((current) => Math.max(current, INITIAL_VISIBLE_MESSAGES));
    setText("");
    setFile(null);
  };

  const toggleAttachmentPreview = (messageId) => {
    setExpandedAttachmentIds((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }));
  };

  return (
    <Panel title="Support chat" subtitle="Chat with librarian for any issue">
      <form className="mb-4 flex gap-2" onSubmit={sendMessage}>
        <div className="flex w-full flex-col gap-2">
          <input
            className="input-field"
            placeholder="Type your issue..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <input
            type="file"
            className="input-field"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </div>
        <button type="submit" className="btn-primary px-5">
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
            onClick={() => setVisibleCount(sortedMessages.length)}
          >
            View more
          </button>
        ) : null}
        {sortedMessages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet. Start by describing your issue.</p>
        ) : (
          visibleMessages.map((msg) => (
            <div
              key={msg._id}
              className={`rounded-lg px-3 py-2 text-sm ${
                msg.senderRole === "Student" ? "bg-indigo-100 text-indigo-900" : "bg-white text-slate-700"
              }`}
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
  );
};

export default StudentSupportChatPage;
