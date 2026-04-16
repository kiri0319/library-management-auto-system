import { useEffect, useRef, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import { resolveUploadCoverUrl } from "../../utils/bookCover";
import BookCoverCell from "../../components/books/BookCoverCell";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import FormField from "../../components/common/FormField";
import StatusBadge from "../../components/common/StatusBadge";

const emptyBookForm = {
  title: "",
  description: "",
  author: "",
  category: "",
  isbn: "",
  quantity: 1,
  availableCopies: 1,
  shelfLocation: "",
  tags: "",
  coverImage: "",
};

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [editingId, setEditingId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [coverError, setCoverError] = useState("");
  const coverInputRef = useRef(null);

  const loadAll = () => {
    Promise.all([
      libraryApi.books.list(),
      libraryApi.categories.list(),
      libraryApi.authors.list(),
    ]).then(([booksRes, categoriesRes, authorsRes]) => {
      setBooks(booksRes.data);
      setCategories(categoriesRes.data);
      setAuthors(authorsRes.data);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onBookChange = (event) => {
    setBookForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const resetCoverSelection = () => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setCoverError("");
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const onCoverFileChange = (event) => {
    const file = event.target.files?.[0];
    setCoverError("");
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    if (!file) {
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Image must be 5 MB or smaller.");
      setCoverFile(null);
      setCoverPreviewUrl(null);
      event.target.value = "";
      return;
    }
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const saveBook = async (event) => {
    event.preventDefault();
    setCoverError("");
    try {
      let coverImage = (bookForm.coverImage || "").trim();
      if (coverFile) {
        const { data } = await libraryApi.books.uploadCover(coverFile);
        coverImage = data.coverImage || coverImage;
      }

      const payload = {
        ...bookForm,
        quantity: Number(bookForm.quantity),
        availableCopies: Number(bookForm.availableCopies),
        tags: bookForm.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      delete payload.coverImage;
      if (coverImage) {
        payload.coverImage = coverImage;
      }

      if (editingId) {
        await libraryApi.books.update(editingId, payload);
      } else {
        await libraryApi.books.create(payload);
      }

      resetCoverSelection();
      setBookForm(emptyBookForm);
      setEditingId(null);
      loadAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not save book or upload cover.";
      setCoverError(msg);
    }
  };

  const editBook = (book) => {
    resetCoverSelection();
    setEditingId(book._id);
    setBookForm({
      title: book.title,
      description: book.description || "",
      author: book.author?._id || "",
      category: book.category?._id || "",
      isbn: book.isbn,
      quantity: book.quantity,
      availableCopies: book.availableCopies,
      shelfLocation: book.shelfLocation || "",
      tags: (book.tags || []).join(", "),
      coverImage: book.coverImage || "",
    });
  };

  const removeBook = async (id) => {
    if (!window.confirm("Delete this book?")) {
      return;
    }

    await libraryApi.books.delete(id);
    loadAll();
  };

  const addCategory = async (event) => {
    event.preventDefault();
    await libraryApi.categories.create({ name: categoryName });
    setCategoryName("");
    loadAll();
  };

  const addAuthor = async (event) => {
    event.preventDefault();
    await libraryApi.authors.create({ name: authorName });
    setAuthorName("");
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={editingId ? "Edit book" : "Add book"} subtitle="Catalog inventory, stock, and shelf metadata">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveBook}>
            <div className="md:col-span-2">
              <FormField label="Title" name="title" value={bookForm.title} onChange={onBookChange} required />
            </div>
            <FormField label="ISBN" name="isbn" value={bookForm.isbn} onChange={onBookChange} required />
            <FormField label="Shelf location" name="shelfLocation" value={bookForm.shelfLocation} onChange={onBookChange} />
            <label className="block">
              <span className="label-text">Author</span>
              <select className="input-field" name="author" value={bookForm.author} onChange={onBookChange} required>
                <option value="">Select author</option>
                {authors.map((author) => (
                  <option key={author._id} value={author._id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label-text">Category</span>
              <select className="input-field" name="category" value={bookForm.category} onChange={onBookChange} required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <FormField label="Quantity" name="quantity" type="number" value={bookForm.quantity} onChange={onBookChange} required />
            <FormField
              label="Available copies"
              name="availableCopies"
              type="number"
              value={bookForm.availableCopies}
              onChange={onBookChange}
              required
            />
            <div className="md:col-span-2">
              <span className="label-text">Book cover (from your device)</span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                JPEG, PNG, GIF, or WebP · up to 5 MB. Shown on the catalog and home page when set; otherwise the app tries Open Library by ISBN.
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800">
                  <input
                    ref={coverInputRef}
                    type="file"
                    name="cover"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={onCoverFileChange}
                  />
                  Choose image
                </label>
                {coverFile ? (
                  <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={resetCoverSelection}>
                    Clear new image
                  </button>
                ) : null}
              </div>
              {coverError ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{coverError}</p> : null}
              {(coverPreviewUrl || resolveUploadCoverUrl(bookForm.coverImage)) && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {coverPreviewUrl ? "New preview" : "Current cover"}
                  </p>
                  <img
                    src={coverPreviewUrl || resolveUploadCoverUrl(bookForm.coverImage)}
                    alt=""
                    className="max-h-44 max-w-[200px] rounded-lg border border-slate-200 object-contain dark:border-slate-600"
                  />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <FormField label="Tags" name="tags" value={bookForm.tags} onChange={onBookChange} placeholder="classic, science, software" />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Description"
                name="description"
                as="textarea"
                rows={4}
                value={bookForm.description}
                onChange={onBookChange}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? "Update book" : "Save book"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    resetCoverSelection();
                    setEditingId(null);
                    setBookForm(emptyBookForm);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="Quick add category" subtitle="Support catalog structuring">
            <form className="flex gap-3" onSubmit={addCategory}>
              <input
                className="input-field"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="New category"
                required
              />
              <button type="submit" className="btn-primary">
                Add
              </button>
            </form>
          </Panel>
          <Panel title="Quick add author" subtitle="Create a new author record">
            <form className="flex gap-3" onSubmit={addAuthor}>
              <input
                className="input-field"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="New author"
                required
              />
              <button type="submit" className="btn-primary">
                Add
              </button>
            </form>
          </Panel>
        </div>
      </div>

      <Panel title="Catalog inventory" subtitle="Books, stock status, and editing controls">
        <DataTable
          rows={books}
          columns={[
            {
              key: "book",
              label: "Book",
              render: (row) => <BookCoverCell book={row} />,
            },
            {
              key: "author",
              label: "Author",
              render: (row) => row.author?.name,
            },
            {
              key: "category",
              label: "Category",
              render: (row) => row.category?.name,
            },
            { key: "isbn", label: "ISBN" },
            {
              key: "stockStatus",
              label: "Stock",
              render: (row) => <StatusBadge value={row.stockStatus} />,
            },
            {
              key: "copies",
              label: "Copies",
              render: (row) => `${row.availableCopies}/${row.quantity}`,
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-3 py-2" onClick={() => editBook(row)}>
                    Edit
                  </button>
                  <button type="button" className="btn-secondary px-3 py-2" onClick={() => removeBook(row._id)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
};

export default BooksPage;

