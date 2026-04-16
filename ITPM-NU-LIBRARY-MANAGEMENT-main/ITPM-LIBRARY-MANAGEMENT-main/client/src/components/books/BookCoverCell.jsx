import BookCover from "./BookCover";

/** Compact cover + title for tables and dense lists */
const BookCoverCell = ({ book }) => {
  if (!book) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200/90 bg-slate-50 dark:border-slate-600">
        <BookCover
          book={book}
          imgClassName="h-full w-full object-cover object-center"
          fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold uppercase text-slate-500 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300"
        />
      </div>
      <span className="min-w-0 font-medium text-slate-800 dark:text-slate-100">{book.title}</span>
    </div>
  );
};

export default BookCoverCell;
