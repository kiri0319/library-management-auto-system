import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSocketApp } from "../../hooks/useSocketApp";
import { libraryApi } from "../../api/libraryApi";
import { formatDateTime } from "../../utils/format";

const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { liveNotifications } = useSocketApp();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    libraryApi.notifications
      .list()
      .then(({ data }) => setNotifications(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (liveNotifications.length) {
      setNotifications((current) => [liveNotifications[0], ...current].slice(0, 15));
    }
  }, [liveNotifications]);

  const markRead = async (id) => {
    try {
      await libraryApi.notifications.markRead(id);
      setNotifications((current) =>
        current.map((item) => (item._id === id ? { ...item, readAt: new Date().toISOString() } : item))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.readAt);
    await Promise.all(unread.map((item) => libraryApi.notifications.markRead(item._id).catch(() => null)));
    setNotifications((current) =>
      current.map((item) => (item.readAt ? item : { ...item, readAt: new Date().toISOString() }))
    );
  };

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.readAt ? 0 : 1), 0),
    [notifications]
  );

  const notificationOverlay = (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        aria-label="Close notifications"
        onClick={() => {
          setIsOpen(false);
          setSelectedNotification(null);
        }}
      />
      <div className="absolute right-0 top-0 h-full w-[min(95vw,460px)] border-l border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <p className="font-semibold text-slate-800">Notifications</p>
            <span className="text-xs text-slate-400">Visible across all dashboard pages</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              onClick={markAllRead}
            >
              Mark all read
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              onClick={() => {
                setIsOpen(false);
                setSelectedNotification(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
        {selectedNotification ? (
          <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{selectedNotification.title}</p>
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                onClick={() => setSelectedNotification(null)}
              >
                Back
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{selectedNotification.message}</p>
            <p className="mt-2 text-[11px] text-slate-500">{formatDateTime(selectedNotification.createdAt)}</p>
            {selectedNotification.link ? (
              <button
                type="button"
                className="mt-3 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={() => {
                  navigate(selectedNotification.link);
                  setIsOpen(false);
                  setSelectedNotification(null);
                }}
              >
                Go to update
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="h-[calc(100%-76px)] space-y-3 overflow-auto pr-1">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                type="button"
                key={notification._id}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  notification.readAt ? "border-slate-200 bg-slate-50" : "border-indigo-100 bg-indigo-50/70"
                }`}
                onClick={async () => {
                  setSelectedNotification(notification);
                  await markRead(notification._id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                  {!notification.readAt ? (
                    <span className="mt-0.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{notification.message}</p>
                <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(notification.createdAt)}</p>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="panel-card mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
          <Sparkles className="h-3.5 w-3.5" />
          Live Library Control
        </p>
        <h1 className="mt-3 font-display text-3xl">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.role} workspace • status {user?.status}
        </p>
      </div>
      <div className="flex items-center gap-3 self-end md:self-auto">
        <div className="relative">
          <button
            type="button"
            className="btn-secondary gap-2"
            onClick={() => setIsOpen((current) => !current)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? `${unreadCount} new` : notifications.length}
          </button>
          {isOpen ? createPortal(notificationOverlay, document.body) : null}
        </div>
        <button type="button" className="btn-secondary gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;

