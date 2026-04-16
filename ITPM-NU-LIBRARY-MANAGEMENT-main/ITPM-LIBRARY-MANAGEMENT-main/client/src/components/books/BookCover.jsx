import { useState } from "react";
import { getBookCoverUrl } from "../../utils/bookCover";

const BookCover = ({
  book,
  fallbackClassName,
  imgClassName = "h-full w-full object-contain object-center p-3 transition-transform duration-300 ease-nu group-hover:scale-105",
}) => {
  const [failed, setFailed] = useState(false);
  const url = getBookCoverUrl(book);

  const fallback =
    fallbackClassName ||
    "flex h-full w-full items-center justify-center bg-gradient-to-br from-nu-primary to-nu-accent font-display text-4xl font-bold text-white/90";

  if (!url || failed) {
    return <div className={fallback}>{book?.title?.slice(0, 2) || "?"}</div>;
  }

  return (
    <img
      src={url}
      alt={book?.title ? `Cover: ${book.title}` : "Book cover"}
      className={imgClassName}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export default BookCover;
