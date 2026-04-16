import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import { useAuth } from "../../hooks/useAuth";
import { useSocketApp } from "../../hooks/useSocketApp";
import Panel from "../../components/common/Panel";
import FormField from "../../components/common/FormField";
import BookCard from "../../components/books/BookCard";
import EmptyState from "../../components/common/EmptyState";

const CatalogPage = () => {
  const { user } = useAuth();
  const { socket, stockUpdate, reservationReady } = useSocketApp();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", author: "" });
  const [message, setMessage] = useState("");

  const loadCatalog = () => {
    Promise.all([
      libraryApi.books.list(filters),
      libraryApi.categories.list(),
      libraryApi.authors.list(),
    ]).then(([booksRes, categoriesRes, authorsRes]) => {
      setBooks(booksRes.data);
      setCategories(categoriesRes.data);
      setAuthors(authorsRes.data);
    });
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (stockUpdate) {
      setBooks((current) =>
        current.map((book) =>
          book._id === stockUpdate.bookId
            ? {
                ...book,
                availableCopies: stockUpdate.availableCopies,
                reservedCount: stockUpdate.reservedCount ?? book.reservedCount,
                stockStatus: stockUpdate.stockStatus || book.stockStatus,
              }
            : book
        )
      );
    }
  }, [stockUpdate]);

  useEffect(() => {
    if (reservationReady) {
      setMessage("One of your reserved books is ready for pickup.");
    }
  }, [reservationReady]);

  useEffect(() => {
    if (socket && books.length) {
      books.forEach((book) => socket.emit("join-book-room", book._id));
    }
  }, [socket, books]);

  const onChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const borrowBook = async (book) => {
    try {
      await libraryApi.borrows.selfBorrow({ bookId: book._id });
      setMessage(`Borrowed "${book.title}" successfully.`);
      loadCatalog();
    } catch (error) {
      setMessage(error.response?.data?.message || "Borrowing failed.");
    }
  };

  const reserveBook = async (book) => {
    try {
      await libraryApi.reservations.create({ bookId: book._id });
      setMessage(`Reserved "${book.title}" successfully.`);
      loadCatalog();
    } catch (error) {
      setMessage(error.response?.data?.message || "Reservation failed.");
    }
  };

  return (
    <div className="space-y-6">
      {message ? <div className="panel-card text-sm text-[color:var(--ink)]">{message}</div> : null}

      <Panel title="Catalog search" subtitle="Search by title, author, category, and live availability">
        <div className="grid gap-4 md:grid-cols-4">
          <FormField label="Search" name="search" value={filters.search} onChange={onChange} placeholder="Title or ISBN" />
          <label className="block">
            <span className="label-text">Category</span>
            <select className="input-field" name="category" value={filters.category} onChange={onChange}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-text">Author</span>
            <select className="input-field" name="author" value={filters.author} onChange={onChange}>
              <option value="">All authors</option>
              {authors.map((author) => (
                <option key={author._id} value={author._id}>
                  {author.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" className="btn-primary w-full" onClick={loadCatalog}>
              Apply filters
            </button>
          </div>
        </div>
      </Panel>

      {user?.status !== "Active" ? (
        <div className="panel-card text-sm text-amber-700">
          Your account status is {user?.status}. Borrowing actions may be limited until the account is reactivated.
        </div>
      ) : null}

      {books.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              actionLabel={book.availableCopies > 0 ? "Borrow now" : "Join queue"}
              onAction={book.availableCopies > 0 ? borrowBook : reserveBook}
              secondaryAction={book.availableCopies > 0 ? "Reserve" : null}
              onSecondaryAction={reserveBook}
              disabled={user?.status !== "Active"}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No books found" description="Adjust filters or add more titles to the catalog." />
      )}
    </div>
  );
};

export default CatalogPage;

