import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Headphones,
  Library,
  Menu,
  Moon,
  Search,
  Sun,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { libraryApi } from "../../api/libraryApi";
import BookCover from "../../components/books/BookCover";

const THEME_KEY = "nu-landing-theme";
const nuEase = [0.16, 1, 0.3, 1];

/** `client/public/hero-library.png` — library interior scene */
const HERO_BG = `${import.meta.env.BASE_URL}hero-library.png`;

const HERO_STATS = [
  { label: "BOOKS", value: "52,400", suffix: "+" },
  { label: "E-JOURNALS", value: "1,200", suffix: "+" },
  { label: "ACTIVE MEMBERS", value: "8,500", suffix: "+" },
  { label: "SATISFACTION", value: "98.7", suffix: "%" },
];

const BROWSE_CATEGORIES = [
  { name: "Computer Science", hint: "Stacks A–D", tone: "from-blue-600/20 to-cyan-500/20" },
  { name: "Engineering", hint: "Reference & labs", tone: "from-indigo-600/20 to-blue-500/20" },
  { name: "Medicine & Health", hint: "Latest journals", tone: "from-emerald-600/20 to-teal-500/20" },
  { name: "Business & Law", hint: "Case studies", tone: "from-amber-600/20 to-orange-500/20" },
  { name: "Arts & Humanities", hint: "Rare collections", tone: "from-rose-600/20 to-fuchsia-500/20" },
  { name: "Science & Math", hint: "Research core", tone: "from-violet-600/20 to-purple-500/20" },
];

const SERVICES = [
  {
    title: "Borrow & renew",
    text: "Issue desks, self-check kiosks, and online renewals keep circulation smooth.",
    icon: BookOpen,
  },
  {
    title: "Research help",
    text: "Librarians support literature reviews, citations, and database navigation.",
    icon: Headphones,
  },
  {
    title: "Study spaces",
    text: "Quiet floors, group rooms, and extended hours during exam periods.",
    icon: Users,
  },
  {
    title: "Digital campus",
    text: "Remote access to e-journals, e-books, and discovery search from anywhere.",
    icon: Wifi,
  },
];

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Books", href: "#books" },
  { label: "Categories", href: "#categories" },
  { label: "Services", href: "#services" },
];

const trimDescription = (text) => {
  if (!text) {
    return "Browse this title in the library catalog and check live availability.";
  }
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const pseudoRating = (id) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return (4.2 + (Math.abs(h) % 8) / 10).toFixed(1);
};

const StarRating = ({ value }) => {
  const v = Math.min(5, Math.max(0, parseFloat(String(value))));
  const full = Math.min(5, Math.floor(v));

  return (
    <div
      className="flex items-center gap-0.5 text-[10px] text-amber-400 sm:text-xs"
      aria-label={`Rating ${value} of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>
          ★
        </span>
      ))}
      <span className="ml-0.5 font-semibold tabular-nums text-slate-600 dark:text-slate-300">{value}</span>
    </div>
  );
};

const availabilityClass = (status) => {
  if (status === "Out of Stock") {
    return "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300";
  }
  if (status === "Limited Stock") {
    return "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-200";
  }
  return "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/30 dark:text-emerald-200";
};

const LandingPage = () => {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef(null);
  const parallaxBx = useMotionValue(0);
  const parallaxBy = useMotionValue(0);
  const parallaxX = useSpring(parallaxBx, { stiffness: 64, damping: 20 });
  const parallaxY = useSpring(parallaxBy, { stiffness: 64, damping: 20 });
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [booksLoading, setBooksLoading] = useState(true);
  const [searchBusy, setSearchBusy] = useState(false);
  const [booksError, setBooksError] = useState("");
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const node = heroRef.current;
    if (!node) return undefined;
    const handle = (e) => {
      const r = node.getBoundingClientRect();
      const px = (e.clientX - r.left) / Math.max(r.width, 1) - 0.5;
      const py = (e.clientY - r.top) / Math.max(r.height, 1) - 0.5;
      parallaxBx.set(px * -32);
      parallaxBy.set(py * -32);
    };
    const leave = () => {
      parallaxBx.set(0);
      parallaxBy.set(0);
    };
    node.addEventListener("mousemove", handle);
    node.addEventListener("mouseleave", leave);
    return () => {
      node.removeEventListener("mousemove", handle);
      node.removeEventListener("mouseleave", leave);
    };
  }, [reduceMotion, parallaxBx, parallaxBy]);

  const loadBooks = useCallback(async (searchText = "", { isUserSearch = false } = {}) => {
    const q = typeof searchText === "string" ? searchText.trim() : "";
    try {
      if (isUserSearch) {
        setSearchBusy(true);
      }
      setBooksLoading(true);
      const response = await libraryApi.books.list(q ? { search: q } : {});
      const books = Array.isArray(response.data) ? response.data : [];

      setFeaturedBooks(q ? books : books.slice(0, 8));
      setAppliedSearch(q);
      setBooksError("");
    } catch (error) {
      setBooksError(error.response?.data?.message || "Unable to load books right now.");
    } finally {
      setBooksLoading(false);
      if (isUserSearch) {
        setSearchBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBooks("", { isUserSearch: false });
  }, [loadBooks]);

  const handleCatalogSearch = () => {
    void (async () => {
      await loadBooks(heroQuery, { isUserSearch: true });
      document.getElementById("books")?.scrollIntoView({ behavior: "smooth", block: "start" });
    })();
  };

  const handleClearCatalogSearch = () => {
    setHeroQuery("");
    void loadBooks("", { isUserSearch: false });
  };

  const transition = useMemo(
    () => (reduceMotion ? { duration: 0.01 } : { duration: 0.65, ease: nuEase }),
    [reduceMotion]
  );

  const fadeUpBlur = useMemo(
    () => ({
      hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, filter: "blur(12px)" },
      visible: reduceMotion
        ? { opacity: 1, transition }
        : { opacity: 1, y: 0, filter: "blur(0px)", transition },
    }),
    [reduceMotion, transition]
  );

  const staggerContainer = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: reduceMotion ? {} : { staggerChildren: 0.08, delayChildren: 0.06 },
      },
    }),
    [reduceMotion]
  );

  const scrollToSearch = () => {
    document.getElementById("hero-search")?.focus();
    document.getElementById("hero-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div
      id="top"
      className={`nu-landing relative min-h-screen overflow-x-hidden bg-[var(--nu-bg)] font-nu text-[var(--nu-text)] transition-colors duration-300 ${theme === "dark" ? "dark" : ""}`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-3 lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-nu glass-surface px-3 py-2 sm:gap-3 sm:px-4">
          <Link to="/" className="group flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-nu-primary to-nu-accent text-white shadow-nu transition-transform duration-300 ease-nu group-hover:scale-[1.02] sm:h-9 sm:w-9">
              <Library className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="truncate font-display text-sm font-bold tracking-tight sm:text-base">
              NU <span className="text-gradient">LIBRARY</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300 lg:flex lg:gap-6">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-nu-primary dark:hover:text-nu-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              type="button"
              onClick={scrollToSearch}
              whileTap={{ scale: 0.96 }}
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white/50 hover:text-nu-primary dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-nu-accent"
              aria-label="Search catalog"
            >
              <Search className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </motion.button>
            <motion.button
              type="button"
              onClick={toggleTheme}
              whileTap={{ scale: 0.96 }}
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10"
              aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              ) : (
                <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              )}
            </motion.button>
            <div className="hidden sm:flex sm:items-center sm:gap-1.5">
              <Link
                to="/login"
                className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/60 active:scale-[0.96] dark:text-slate-200 dark:hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link to="/register" className="btn-primary-solid !px-3 !py-1.5 !text-xs shadow-nu">
                Join
              </Link>
            </div>
            <motion.button
              type="button"
              className="rounded-lg p-1.5 text-slate-700 dark:text-slate-200 lg:hidden"
              whileTap={{ scale: 0.96 }}
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              key="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: nuEase }}
              className="mx-auto mt-1.5 max-w-7xl overflow-hidden rounded-nu border border-white/40 bg-white/80 shadow-nu dark:border-white/10 dark:bg-slate-900/90 lg:hidden"
            >
              <div className="flex flex-col gap-0.5 px-3 py-3">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <hr className="my-2 border-slate-200/80 dark:border-white/10" />
                <Link
                  to="/login"
                  className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg px-2.5 py-2 text-xs font-semibold text-nu-primary dark:text-nu-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  Create account
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main id="main">
        <section
          ref={heroRef}
          className="relative flex min-h-[100dvh] flex-col overflow-hidden pt-[4.75rem] sm:pt-20"
        >
          {reduceMotion ? (
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 dark:opacity-100"
              style={{ backgroundImage: `url('${HERO_BG}')` }}
              aria-hidden
            />
          ) : (
            <motion.div
              className="absolute inset-0 bg-cover bg-center will-change-transform opacity-45 dark:opacity-100"
              style={{ backgroundImage: `url('${HERO_BG}')` }}
              x={parallaxX}
              y={parallaxY}
              scale={1.1}
              aria-hidden
            />
          )}
          {/* Light mode: soft sky-blue wash */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-sky-100/95 via-sky-50/93 to-sky-100/97 dark:hidden"
            aria-hidden
          />
          <div className="absolute inset-0 bg-sky-200/25 dark:hidden" aria-hidden />
          {/* Dark mode: dramatic library overlay */}
          <div className="absolute inset-0 hidden bg-slate-950/65 backdrop-blur-[1px] dark:block" aria-hidden />
          <div
            className="absolute inset-0 hidden bg-gradient-to-b from-blue-950/75 via-slate-950/60 to-slate-950/88 dark:block"
            aria-hidden
          />
          <div
            className="absolute inset-0 hidden hero-gradient opacity-40 mix-blend-soft-light dark:block"
            aria-hidden
          />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-8 text-center sm:px-6 lg:px-8">
            <motion.div
              className="mx-auto flex w-full max-w-4xl flex-col items-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeUpBlur}>
                <span className="inline-flex items-center rounded-full border border-sky-200/90 bg-white/75 px-4 py-2 text-xs font-medium tracking-wide text-slate-700 shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-white/95 sm:text-sm">
                  • Open 24/7 — Digital &amp; Physical Collection
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUpBlur}
                className="mt-8 font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:text-[3.25rem] lg:leading-[1.15]"
             >
                Discover a World of Knowledge at{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="text-slate-900 dark:text-white">NU Library</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full text-sky-500 dark:text-cyan-400"
                    viewBox="0 0 280 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M4 10C72 4 140 12 208 6C232 4 256 3 276 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUpBlur}
                className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg"
              >
                Explore over 50,000 books, journals, and digital resources. Your academic journey starts here.
              </motion.p>

              <motion.div variants={fadeUpBlur} className="mt-10 w-full max-w-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCatalogSearch();
                  }}
                  className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white p-2 shadow-nu-lg sm:flex-row sm:items-center sm:gap-0 sm:p-2 sm:pl-3 dark:border-slate-600 dark:bg-slate-900"
                >
                  <label htmlFor="hero-search" className="sr-only">
                    Search catalog
                  </label>
                  <div className="relative flex flex-1 items-center rounded-xl bg-slate-50 ring-1 ring-slate-200/90 dark:bg-slate-800/90 dark:ring-slate-600/80">
                    <Search className="pointer-events-none absolute left-3 h-5 w-5 text-slate-500 dark:text-slate-400 sm:left-1" />
                    <motion.input
                      id="hero-search"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      placeholder="Search books, authors, topics…"
                      initial={reduceMotion ? false : { opacity: 0.9, y: 6 }}
                      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: nuEase, delay: 0.25 }}
                      className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-11 pr-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400 sm:py-3 sm:pl-10"
                      autoComplete="off"
                      aria-busy={searchBusy}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={searchBusy}
                    whileTap={{ scale: 0.96 }}
                    className="btn-primary-solid flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 disabled:opacity-60 sm:rounded-full"
                  >
                    {searchBusy ? "Searching…" : "Search"}
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </form>
              </motion.div>

              <motion.div variants={fadeUpBlur} className="mt-12 flex flex-col items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  Explore the catalog
                </span>
                <motion.button
                  type="button"
                  aria-label="Scroll to featured books"
                  onClick={() =>
                    document.getElementById("books")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/12 text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors hover:border-white/55 hover:bg-white/20"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  animate={reduceMotion ? false : { y: [0, 7, 0] }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { repeat: Infinity, duration: 2.4, ease: [0.45, 0, 0.55, 1] }
                  }
                >
                  <ChevronDown
                    className="h-7 w-7 transition-transform group-hover:translate-y-0.5"
                    strokeWidth={2.25}
                  />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          <div className="relative z-10 mt-auto border-t border-white/10 bg-slate-950/40 px-4 py-8 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
              {HERO_STATS.map((s) => (
                <motion.div
                  key={s.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUpBlur}
                  className="text-center"
                >
                  <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
                    {s.value}
                    <span className="text-2xl text-cyan-300 sm:text-3xl">{s.suffix}</span>
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="books"
          className="scroll-mt-28 border-t border-[var(--nu-border)] bg-[var(--nu-bg-muted)] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nu-primary dark:text-nu-accent sm:text-sm">
                  {appliedSearch ? "Search results" : "Featured books"}
                </p>
                <h2 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">
                  {appliedSearch ? (
                    <>
                      Results for &ldquo;{appliedSearch}&rdquo;
                    </>
                  ) : (
                    "From the live catalog"
                  )}
                </h2>
                {appliedSearch ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Matching title, author, ISBN, or tags.
                  </p>
                ) : null}
              </div>
              <div className="flex max-w-xl flex-col items-start gap-2 sm:items-end">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {appliedSearch
                    ? "Showing books returned by your search. Clear to go back to featured picks."
                    : "Covers, star ratings, categories, and availability from your live API."}
                </p>
                {appliedSearch ? (
                  <button
                    type="button"
                    onClick={handleClearCatalogSearch}
                    className="text-sm font-semibold text-nu-primary underline-offset-2 hover:underline dark:text-nu-accent"
                  >
                    Clear search
                  </button>
                ) : null}
              </div>
            </motion.div>

            {booksError ? (
              <p className="mt-8 rounded-nu border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
                {booksError}
              </p>
            ) : booksLoading ? (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/80" />
                ))}
              </div>
            ) : featuredBooks.length ? (
              <motion.div
                className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
              >
                {featuredBooks.map((book) => {
                  const rating = pseudoRating(book._id);

                  return (
                    <motion.article
                      key={book._id}
                      variants={fadeUpBlur}
                      whileHover={reduceMotion ? {} : { y: -2 }}
                      transition={{ duration: 0.35, ease: nuEase }}
                      className="card-elevated group flex flex-col overflow-hidden rounded-xl"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--nu-bg-muted)]">
                        <BookCover book={book} />
                        <span
                          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-xs ${availabilityClass(book.stockStatus)}`}
                        >
                          {book.stockStatus}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <StarRating value={rating} />
                        <h3 className="mt-2 line-clamp-2 font-display text-sm font-bold leading-snug sm:text-base">
                          {book.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {book.author?.name || "Unknown author"}
                        </p>
                        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {trimDescription(book.description)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {book.category?.name ? (
                            <span className="rounded-full bg-nu-primary/10 px-2 py-0.5 text-[10px] font-semibold text-nu-primary dark:bg-nu-accent/15 dark:text-nu-accent sm:text-xs">
                              {book.category.name}
                            </span>
                          ) : null}
                          {(book.tags || []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--nu-border)] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 sm:text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-[var(--nu-border)] pt-3 text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          <span>
                            <span className="font-semibold text-[var(--nu-text)]">{book.availableCopies}</span> /{" "}
                            {book.quantity} copies
                          </span>
                          <span className="text-xs font-medium text-slate-500">Queue {book.queueCount ?? 0}</span>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            ) : (
              <p className="mt-10 rounded-nu border border-[var(--nu-border)] bg-[var(--nu-surface)] px-4 py-6 text-sm text-slate-600 dark:text-slate-400">
                {appliedSearch
                  ? `No books match “${appliedSearch}”. Try another keyword or clear search.`
                  : "No books in the catalog yet."}
              </p>
            )}
          </div>
        </section>

        <section id="categories" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-nu-primary dark:text-nu-accent">
                Browse
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Explore by subject</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Curated lanes for every discipline.
              </p>
            </motion.div>

            <motion.div
              className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {BROWSE_CATEGORIES.map((cat) => (
                <motion.a
                  key={cat.name}
                  href="#books"
                  variants={fadeUpBlur}
                  whileHover={reduceMotion ? {} : { y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`card-elevated group relative overflow-hidden bg-gradient-to-br ${cat.tone} p-6`}
                >
                  <h3 className="font-display text-xl font-bold">{cat.name}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{cat.hint}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-nu-primary dark:text-nu-accent">
                    View catalog <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-28 border-t border-[var(--nu-border)] bg-[var(--nu-bg-muted)] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-nu-primary dark:text-nu-accent">
                  Services
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Library services</h2>
              </div>
              <p className="max-w-lg text-sm text-slate-600 dark:text-slate-400">
                Everything the library delivers, structured for real workflows.
              </p>
            </motion.div>

            <motion.div
              className="mt-12 grid gap-6 sm:grid-cols-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {SERVICES.map((s) => (
                <motion.article
                  key={s.title}
                  variants={fadeUpBlur}
                  whileHover={reduceMotion ? {} : { y: -2 }}
                  className="card-elevated flex gap-5 p-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-nu-primary/15 to-nu-accent/20 text-nu-primary dark:text-nu-accent">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.text}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--nu-border)] bg-[var(--nu-bg)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-xl font-bold">
              NU <span className="text-gradient">LIBRARY</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Modern online library management—search, circulation, and role-based dashboards.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Explore</p>
              <ul className="mt-3 space-y-2 text-sm font-medium">
                <li>
                  <a href="#books" className="text-slate-700 hover:text-nu-primary dark:text-slate-300 dark:hover:text-nu-accent">
                    Books
                  </a>
                </li>
                <li>
                  <a
                    href="#categories"
                    className="text-slate-700 hover:text-nu-primary dark:text-slate-300 dark:hover:text-nu-accent"
                  >
                    Categories
                  </a>
                </li>
                <li>
                  <a
                    href="#services"
                    className="text-slate-700 hover:text-nu-primary dark:text-slate-300 dark:hover:text-nu-accent"
                  >
                    Services
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Account</p>
              <ul className="mt-3 space-y-2 text-sm font-medium">
                <li>
                  <Link to="/login" className="text-slate-700 hover:text-nu-primary dark:text-slate-300 dark:hover:text-nu-accent">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-slate-700 hover:text-nu-primary dark:text-slate-300 dark:hover:text-nu-accent"
                  >
                    Register
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Campus</p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Main Library · Digital Commons</p>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-7xl border-t border-[var(--nu-border)] pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} NU LIBRARY · React · Tailwind · Framer Motion
        </p>
      </footer>

      <AnimatePresence>
        {showBackTop ? (
          <motion.button
            key="back-top"
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.35, ease: nuEase }}
            onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35)] backdrop-blur-md dark:border-white/15 dark:bg-slate-900/92 dark:text-white"
            aria-label="Back to top"
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2.25} />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
