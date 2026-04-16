const OPEN_LIBRARY_BASE = "https://covers.openlibrary.org/b/isbn";

export const resolveUploadCoverUrl = (coverImage) => {
  if (!coverImage) {
    return null;
  }
  if (coverImage.startsWith("http")) {
    return coverImage;
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${coverImage.startsWith("/") ? "" : "/"}${coverImage}`;
};

export const getOpenLibraryCoverUrl = (isbn) => {
  if (!isbn) {
    return null;
  }
  const digits = String(isbn).replace(/[^0-9X]/gi, "");
  if (!digits) {
    return null;
  }
  return `${OPEN_LIBRARY_BASE}/${digits}-L.jpg`;
};

export const getBookCoverUrl = (book) => {
  const fromDb = resolveUploadCoverUrl(book?.coverImage);
  if (fromDb) {
    return fromDb;
  }
  return getOpenLibraryCoverUrl(book?.isbn);
};
