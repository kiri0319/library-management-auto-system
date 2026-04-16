import { Clock3 } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import BookCover from "./BookCover";

const BookCard = ({ book, actionLabel, onAction, secondaryAction, onSecondaryAction, disabled }) => (
  <article className="panel-card group h-full">
    <div className="relative mb-4">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40">
        <BookCover
          book={book}
          imgClassName="h-full w-full object-cover object-center p-0 transition-transform duration-300 ease-nu group-hover:scale-[1.02]"
          fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--paper)] to-white font-display text-4xl font-bold text-[color:var(--accent)] dark:from-slate-800 dark:to-slate-900"
        />
      </div>
      <div className="absolute right-2 top-2">
        <StatusBadge value={book.stockStatus} />
      </div>
    </div>
    <h3 className="font-display text-2xl">{book.title}</h3>
    <p className="mt-2 text-sm text-slate-500">
      {book.author?.name} • {book.category?.name}
    </p>
    <p className="mt-4 min-h-[72px] text-sm text-slate-600">{book.description}</p>
    <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
      <Clock3 className="h-4 w-4" />
      Queue {book.queueCount || 0} • Copies {book.availableCopies}/{book.quantity}
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      {actionLabel ? (
        <button type="button" className="btn-primary" disabled={disabled} onClick={() => onAction(book)}>
          {actionLabel}
        </button>
      ) : null}
      {secondaryAction ? (
        <button type="button" className="btn-secondary" onClick={() => onSecondaryAction(book)}>
          {secondaryAction}
        </button>
      ) : null}
    </div>
  </article>
);

export default BookCard;
