import http from "./http";

const downloadBlob = async (url, fileName) => {
  const response = await http.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(blobUrl);
};

export const libraryApi = {
  auth: {
    login: (payload) => http.post("/auth/login", payload),
    register: (payload) => http.post("/auth/register", payload),
    forgotPassword: (payload) => http.post("/auth/forgot-password", payload),
    resetPassword: (payload) => http.post("/auth/reset-password", payload),
    me: () => http.get("/auth/me"),
  },
  users: {
    list: (params) => http.get("/users", { params }),
    create: (payload) => http.post("/users", payload),
    update: (id, payload) => http.put(`/users/${id}`, payload),
    delete: (id) => http.delete(`/users/${id}`),
    updateProfile: (payload) => http.put("/users/profile", payload),
  },
  categories: {
    list: () => http.get("/categories"),
    create: (payload) => http.post("/categories", payload),
  },
  authors: {
    list: () => http.get("/authors"),
    create: (payload) => http.post("/authors", payload),
  },
  books: {
    list: (params) => http.get("/books", { params }),
    get: (id) => http.get(`/books/${id}`),
    create: (payload) => http.post("/books", payload),
    update: (id, payload) => http.put(`/books/${id}`, payload),
    delete: (id) => http.delete(`/books/${id}`),
    uploadCover: (file) => {
      const body = new FormData();
      body.append("cover", file);
      return http.post("/books/upload-cover", body);
    },
  },
  borrows: {
    list: (params) => http.get("/borrows", { params }),
    issue: (payload) => http.post("/borrows/issue", payload),
    selfBorrow: (payload) => http.post("/borrows/self", payload),
    returnBook: (payload) => http.post("/borrows/return", payload),
  },
  reservations: {
    list: () => http.get("/reservations"),
    create: (payload) => http.post("/reservations", payload),
    cancel: (id) => http.delete(`/reservations/${id}`),
  },
  fines: {
    list: () => http.get("/fines"),
    update: (id, payload) => http.put(`/fines/${id}`, payload),
  },
  dashboard: {
    admin: () => http.get("/dashboard/admin"),
    librarian: () => http.get("/dashboard/librarian"),
    student: () => http.get("/dashboard/student"),
  },
  notifications: {
    list: () => http.get("/notifications"),
    markRead: (id) => http.put(`/notifications/${id}/read`),
  },
  reports: {
    borrowing: () => downloadBlob("/reports/borrowing", "monthly-borrowing-report.pdf"),
    fines: () => downloadBlob("/reports/fines", "fine-collection-report.pdf"),
    activity: () => downloadBlob("/reports/activity", "user-activity-report.pdf"),
  },
  settings: {
    list: () => http.get("/settings"),
    update: (id, payload) => http.put(`/settings/${id}`, payload),
  },
  activityLogs: {
    list: (params) => http.get("/activity-logs", { params }),
  },
};

