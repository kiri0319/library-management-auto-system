import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Headphones,
  Library,
  Menu,
  Moon,
  ShieldCheck,
  Search,
  Sparkles,
  Sun,
  User,
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

const HERO_READING_SCENE = [
  { id: "single-student", kind: "single", label: "Single student", x: "10%", y: "59%", delay: 0 },
  { id: "group-students", kind: "group", label: "Group students", x: "88%", y: "59%", delay: 0.4 },
  { id: "reading-book", kind: "book", label: "Reading book", x: "48%", y: "77%", delay: 0.8 },
];

const BROWSE_CATEGORIES = [
  { name: "Computer Science", hint: "Stacks A–D", accent: "from-blue-600 to-cyan-500" },
  { name: "Engineering", hint: "Reference & labs", accent: "from-indigo-600 to-blue-500" },
  { name: "Medicine & Health", hint: "Latest journals", accent: "from-emerald-600 to-teal-500" },
  { name: "Business & Law", hint: "Case studies", accent: "from-amber-600 to-orange-500" },
  { name: "Arts & Humanities", hint: "Rare collections", accent: "from-rose-600 to-fuchsia-500" },
  { name: "Science & Math", hint: "Research core", accent: "from-violet-600 to-purple-500" },
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

const DISCUSSION_SPACES = [
  {
    title: "Conference Room",
    hours: "9:00 AM to 5:00 PM",
    duration: "Maximum 3 hours (extendable on request)",
    occupancy: "12 seats",
    preference: "Conferences",
    reservation: "Academic / Non-Academic Staff",
  },
  {
    title: "Collaborative Space",
    hours: "9:00 AM to 5:00 PM",
    duration: "Maximum 3 hours (extendable on request)",
    occupancy: "12 seats",
    preference: "Group collaboration",
    reservation: "Academic / Non-Academic Staff",
  },
  {
    title: "Research Commons",
    hours: "9:00 AM to 5:00 PM",
    duration: "Maximum 3 hours (extendable on request)",
    occupancy: "12 seats",
    preference: "Research discussions",
    reservation: "Academic / Non-Academic Staff",
  },
];

const DISCUSSION_RULES = [
  "Discussion rooms require a minimum group size of 5-8 students.",
  "Collaborative space requires a minimum group size of 10-16 students.",
  "Food and beverages are not allowed inside study spaces (water only).",
];

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Books", href: "#books" },
  { label: "Categories", href: "#categories" },
  { label: "Services", href: "#services" },
];

const HERO_QUICK_TAGS = ["IEEE Xplore", "Scopus", "Final year projects", "Machine learning", "Civil engineering"];
const HERO_EXPERIENCE_TABS = [
  { id: "learning", label: "Learning Space Reservation" },
  { id: "discussion", label: "Discussion Space Reservation" },
  { id: "research", label: "Research Support Desk" },
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
  const [heroTab, setHeroTab] = useState("learning");
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-nu glass-surface bg-slate-900/85 px-3 py-2 sm:gap-3 sm:px-4">
          <Link to="/" className="group flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-nu-primary to-nu-accent text-[11px] font-extrabold tracking-wide text-white shadow-nu transition-transform duration-300 ease-nu group-hover:scale-[1.02] sm:h-9 sm:w-9 sm:text-xs">
              NU
            </span>
            <span className="truncate font-display text-sm font-bold tracking-tight sm:text-base">
              <span className="text-white">NU </span><span className="text-gradient">SLIIT</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-xs font-semibold text-white/90 lg:flex lg:gap-6">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-amber-300"
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
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 hover:text-amber-200"
              aria-label="Search catalog"
            >
              <Search className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </motion.button>
            <motion.button
              type="button"
              onClick={toggleTheme}
              whileTap={{ scale: 0.96 }}
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15"
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
                className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 active:scale-[0.96]"
              >
                Sign in
              </Link>
              <Link to="/register" className="btn-primary-solid !px-3 !py-1.5 !text-xs shadow-nu">
                Join
              </Link>
            </div>
            <motion.button
              type="button"
              className="rounded-lg p-1.5 text-white lg:hidden"
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
          {!reduceMotion
            ? HERO_READING_SCENE.map((item) => (
                <motion.div
                  key={item.id}
                  className="pointer-events-none absolute z-[3] hidden items-center gap-2 rounded-full border border-white/80 bg-white/92 px-3 py-2 text-slate-900 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.35)] backdrop-blur-md md:flex dark:border-white/20 dark:bg-slate-900/75 dark:text-cyan-100"
                  style={{ left: item.x, top: item.y }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: [0.75, 1, 0.75],
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: item.delay,
                  }}
                  aria-hidden
                >
                  {item.kind === "single" ? <User className="h-5 w-5" strokeWidth={2.3} /> : null}
                  {item.kind === "group" ? <Users className="h-5 w-5" strokeWidth={2.3} /> : null}
                  {item.kind === "book" ? <BookOpen className="h-5 w-5" strokeWidth={2.3} /> : null}
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </motion.div>
              ))
            : null}
          <div className="pointer-events-none absolute left-[8%] top-[26%] h-24 w-24 rounded-full bg-white/25 blur-2xl dark:bg-cyan-400/10" aria-hidden />
          <div className="pointer-events-none absolute right-[10%] top-[40%] h-20 w-20 rounded-full bg-sky-200/35 blur-2xl dark:bg-blue-400/10" aria-hidden />
          <div className="pointer-events-none absolute bottom-[18%] left-[15%] h-16 w-16 rounded-full bg-indigo-200/35 blur-2xl dark:bg-indigo-400/10" aria-hidden />
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
            className="absolute inset-0 bg-gradient-to-b from-sky-100/96 via-sky-100/95 to-sky-200/96 dark:hidden"
            aria-hidden
          />
          <div className="absolute inset-0 bg-sky-300/35 dark:hidden" aria-hidden />
          <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-sky-300/35 blur-3xl dark:hidden" aria-hidden />
          <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-indigo-300/35 blur-3xl dark:hidden" aria-hidden />
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
                <span className="inline-flex items-center rounded-full border border-sky-200/90 bg-white/90 px-4 py-2 text-xs font-semibold tracking-wide text-slate-700 shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-white/95 sm:text-sm">
                  • Open 24/7 — Digital &amp; Physical Collection
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUpBlur}
                className="mt-8 font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:text-[3.2rem] lg:leading-[1.15]"
             >
                Discover a World of Knowledge at{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="text-slate-900 dark:text-white">NU Library</span>
                </span>
              </motion.h1>

              <motion.p variants={fadeUpBlur} className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
                Explore over 50,000 books, journals, and digital resources. Your academic journey starts here.
              </motion.p>

              <motion.div variants={fadeUpBlur} className="mt-7 flex w-full max-w-3xl flex-wrap justify-center gap-2.5">
                {HERO_EXPERIENCE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHeroTab(tab.id)}
                    className={`rounded-lg border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                      heroTab === tab.id
                        ? "border-amber-300 bg-amber-300 text-slate-900 shadow-[0_10px_22px_-10px_rgba(245,158,11,0.8)]"
                        : "border-white/45 bg-slate-900/65 text-white hover:-translate-y-0.5 hover:bg-slate-900/85"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </motion.div>

              <motion.div variants={fadeUpBlur} className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs">
                <span className="rounded-full border border-slate-300/80 bg-white/85 px-3 py-1 font-semibold text-slate-700 backdrop-blur dark:text-white">
                  50K+ catalog records
                </span>
                <span className="rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 font-medium text-slate-700 backdrop-blur dark:text-white/90">
                  Real-time availability
                </span>
                <span className="rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 font-medium text-slate-700 backdrop-blur dark:text-white/90">
                  Multi-device access
                </span>
              </motion.div>

              <motion.div variants={fadeUpBlur} className="mt-10 w-full max-w-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCatalogSearch();
                  }}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.65)] sm:flex-row sm:items-center sm:gap-0 sm:p-2 sm:pl-3 dark:border-slate-600 dark:bg-slate-900"
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
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {HERO_QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setHeroQuery(tag);
                        void loadBooks(tag, { isUserSearch: true });
                      }}
                      className="rounded-full border border-white/75 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white dark:border-white/25 dark:bg-white/10 dark:text-white/85 dark:hover:bg-white/15"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={fadeUpBlur}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/35 bg-slate-900/45 px-4 py-2 text-[11px] font-medium text-white/90 backdrop-blur sm:text-xs"
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                Live catalog online
                <span className="h-3 w-px bg-white/25" />
                Staff support available now
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
                  <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)] sm:text-4xl">
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
          <div className="mx-auto mb-8 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-nu-primary/35 to-transparent" />
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
          <div className="mx-auto mb-8 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-nu-primary/25 to-transparent" />
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-nu-primary dark:text-nu-accent">
                Browse
              </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Explore by subject</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Professionally curated subject lanes with focused catalog entry points for each discipline.
              </p>
            </motion.div>

            <motion.div
              className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
                  whileHover={reduceMotion ? {} : { y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="card-elevated group relative overflow-hidden bg-white p-6 dark:bg-slate-900"
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${cat.accent} opacity-85`} />
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-slate-100/90 blur-2xl transition-opacity duration-300 group-hover:opacity-90 dark:bg-slate-700/30" />
                  <div className="relative z-10">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      Subject lane
                    </span>
                    <h3 className="mt-3 font-display text-xl font-bold tracking-tight">{cat.name}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{cat.hint}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-nu-primary dark:text-nu-accent">
                      View catalog <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-200 to-transparent opacity-60 transition-opacity group-hover:opacity-90 dark:from-slate-700" />
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-transparent transition group-hover:ring-nu-primary/20" />
                </motion.a>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs"
            >
              <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                6 academic clusters
              </span>
              <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                Live catalog linked
              </span>
              <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                Updated each semester
              </span>
            </motion.div>
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-28 border-t border-[var(--nu-border)] bg-[var(--nu-bg-muted)] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto mb-8 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-nu-primary/35 to-transparent" />
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
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1 font-medium text-slate-600 dark:text-slate-300">
                    Staff-assisted
                  </span>
                  <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1 font-medium text-slate-600 dark:text-slate-300">
                    Digital + physical support
                  </span>
                </div>
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
                  className="card-elevated group relative flex gap-5 overflow-hidden p-6"
                >
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/30 blur-2xl transition-opacity duration-300 group-hover:opacity-90" />
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-nu-primary/15 to-nu-accent/20 text-nu-primary ring-1 ring-nu-primary/20 dark:text-nu-accent">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <div className="relative z-10">
                    <span className="inline-flex rounded-full border border-slate-900/10 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      Core service
                    </span>
                    <h3 className="font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.text}</p>
                    <a
                      href="#discussion-spaces"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-nu-primary transition group-hover:gap-2 dark:text-nu-accent"
                    >
                      Learn more <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-nu-primary/70 via-nu-accent/70 to-transparent opacity-40 transition-opacity group-hover:opacity-80" />
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="discussion-spaces" className="scroll-mt-28 relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute -left-16 top-20 h-56 w-56 rounded-full bg-nu-primary/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-nu-accent/10 blur-3xl" aria-hidden />
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-nu-primary dark:text-nu-accent">
                Discussion Space Details
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Library Learning Space Booking</h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Space booking facility is available at NU Library for staff and approved academic use. Choose the best
                environment for conferences, research collaboration, and focused discussion.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                  Staff-only reservations
                </span>
                <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                  Max 3-hour slots
                </span>
                <span className="rounded-full border border-[var(--nu-border)] bg-[var(--nu-surface)] px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                  Professional collaboration spaces
                </span>
              </div>
            </motion.div>

            <motion.div
              className="mt-12 grid gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {DISCUSSION_SPACES.map((space) => (
                <motion.article
                  key={space.title}
                  variants={fadeUpBlur}
                  whileHover={reduceMotion ? {} : { y: -3 }}
                  className="card-elevated group relative overflow-hidden p-6"
                >
                  <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-white/35 blur-2xl transition-opacity group-hover:opacity-95" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-2xl font-bold tracking-tight">{space.title}</h3>
                      <span className="rounded-full border border-slate-900/10 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                        Premium zone
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-nu-primary dark:text-nu-accent" />
                        <span><span className="font-semibold">Operating hours:</span> {space.hours}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-nu-primary dark:text-nu-accent" />
                        <span><span className="font-semibold">Booking duration:</span> {space.duration}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-nu-primary dark:text-nu-accent" />
                        <span><span className="font-semibold">Occupancy:</span> {space.occupancy}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-nu-primary dark:text-nu-accent" />
                        <span><span className="font-semibold">Preference:</span> {space.preference}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nu-primary dark:text-nu-accent" />
                        <span><span className="font-semibold">Reservation valid:</span> {space.reservation}</span>
                      </li>
                    </ul>
                    <div className="mt-5">
                      <a
                        href="#services"
                        className="inline-flex items-center gap-1.5 rounded-full border border-nu-primary/30 bg-nu-primary/10 px-3 py-1.5 text-xs font-semibold text-nu-primary transition hover:bg-nu-primary hover:text-white dark:border-nu-accent/40 dark:bg-nu-accent/10 dark:text-nu-accent dark:hover:bg-nu-accent dark:hover:text-slate-950"
                      >
                        Book request <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-nu-primary/70 via-nu-accent/70 to-transparent opacity-40 transition-opacity group-hover:opacity-85" />
                </motion.article>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="mt-8 card-elevated relative overflow-hidden p-6"
            >
              <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-3xl bg-gradient-to-br from-nu-primary/15 to-transparent" />
              <h3 className="font-display text-2xl font-bold">Rules & Regulations for Study Spaces</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                {DISCUSSION_RULES.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="mt-8 card-elevated relative overflow-hidden p-6"
            >
              <div className="absolute left-0 top-0 h-20 w-20 rounded-br-3xl bg-gradient-to-br from-nu-accent/15 to-transparent" />
              <h3 className="font-display text-2xl font-bold">About NU Library</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                NU Library maintains an up-to-date collection of books, periodicals, and digital resources for
                Information Technology, Business Management, Engineering, Architecture, Law, Nursing, and Humanities
                & Sciences. As the central academic resource hub, NU Library continuously expands with core textbooks,
                teacher-recommended e-books, scholarly databases, and multimedia collections through an automated
                library system.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpBlur}
              className="mt-8 grid gap-4 md:grid-cols-3"
            >
              <div className="card-elevated p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Response time</p>
                <p className="mt-2 font-display text-3xl font-bold text-nu-primary">{"< 24h"}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">for room request review</p>
              </div>
              <div className="card-elevated p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Availability</p>
                <p className="mt-2 font-display text-3xl font-bold text-nu-primary">9AM - 5PM</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">staff booking window</p>
              </div>
              <div className="card-elevated p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Support</p>
                <p className="mt-2 font-display text-3xl font-bold text-nu-primary">On-site</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">librarian assistance</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--nu-border)] bg-[var(--nu-bg)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-xl font-bold">
              NU <span className="text-gradient">SLIIT</span>
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
          © {new Date().getFullYear()} NU SLIIT · React · Tailwind · Framer Motion
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
