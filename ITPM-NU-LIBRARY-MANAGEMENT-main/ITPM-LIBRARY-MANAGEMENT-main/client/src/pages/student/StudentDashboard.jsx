import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookCheck, ClockAlert, HandCoins, History, Sparkles, ArrowRight } from "lucide-react";
import { libraryApi } from "../../api/libraryApi";
import { useAuth } from "../../hooks/useAuth";
import StatCard from "../../components/common/StatCard";
import LoadingState from "../../components/common/LoadingState";
import MembershipCard from "../../components/qr/MembershipCard";
import Panel from "../../components/common/Panel";
import BookCard from "../../components/books/BookCard";
import BookCoverCell from "../../components/books/BookCoverCell";
import DataTable from "../../components/common/DataTable";
import { formatCurrency, formatDate } from "../../utils/format";

const EmptyHint = ({ icon: Icon, title, body, to, action }) => {
  const reduce = useReducedMotion();
  return (
  <motion.div
    initial={reduce ? false : { opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: reduce ? 0 : 0.35 }}
    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-600 dark:bg-slate-800/40"
  >
    <span className="rounded-full bg-white p-3 shadow-sm dark:bg-slate-800">
      <Icon className="h-8 w-8 text-[color:var(--accent)]" />
    </span>
    <p className="mt-4 font-display text-lg text-slate-800 dark:text-slate-100">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
    <Link
      to={to}
      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
    >
      {action}
      <ArrowRight className="h-4 w-4" />
    </Link>
  </motion.div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryApi.dashboard
      .student()
      .then(({ data }) => setDashboard(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState text="Loading student dashboard..." />;
  }

  if (!dashboard) {
    return (
      <div className="panel-card text-center text-sm text-slate-600 dark:text-slate-400">
        Could not load dashboard. Try refreshing the page.
      </div>
    );
  }

  const hasRecommended = Array.isArray(dashboard.recommendedBooks) && dashboard.recommendedBooks.length > 0;
  const hasRecent = Array.isArray(dashboard.recentBorrows) && dashboard.recentBorrows.length > 0;

  return (
    <div className="space-y-6">
      <MembershipCard user={user} />

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        {...(reduceMotion
          ? {}
          : {
              initial: "hidden",
              animate: "show",
              variants: {
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
              },
            })}
      >
        <motion.div variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <StatCard
            label="Active Borrows"
            value={dashboard.stats.activeBorrows}
            hint="Books currently with you"
            icon={BookCheck}
            tone="green"
            to="/dashboard/student/borrows"
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <StatCard
            label="Reservations"
            value={dashboard.stats.reservations}
            hint="Queue entries in progress"
            icon={ClockAlert}
            tone="blue"
            to="/dashboard/student/reservations"
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <StatCard
            label="Unpaid Fines"
            value={formatCurrency(dashboard.stats.unpaidFineTotal)}
            hint="Outstanding overdue charges"
            icon={HandCoins}
            tone="rose"
            to="/dashboard/student/profile"
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div {...(reduceMotion ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.12 } })}>
          <Panel title="Recommended books" subtitle="Popular titles currently available">
            {hasRecommended ? (
              <div className="grid gap-4 md:grid-cols-2">
                {dashboard.recommendedBooks.map((book, index) => (
                  <motion.div
                    key={book._id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.04 * index }}
                  >
                    <BookCard book={{ ...book, stockStatus: "Available", queueCount: 0 }} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyHint
                icon={Sparkles}
                title="No picks yet"
                body="Browse the catalog to discover books librarians have highlighted for students."
                to="/dashboard/student/catalog"
                action="Explore catalog"
              />
            )}
          </Panel>
        </motion.div>

        <motion.div {...(reduceMotion ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.18 } })}>
          <Panel title="Recent borrowing history" subtitle="Your latest library transactions">
            {hasRecent ? (
              <DataTable
                rows={dashboard.recentBorrows}
                columns={[
                  {
                    key: "book",
                    label: "Book",
                    render: (row) => <BookCoverCell book={row.book} />,
                  },
                  {
                    key: "borrowDate",
                    label: "Borrowed",
                    render: (row) => formatDate(row.borrowDate),
                  },
                  {
                    key: "dueDate",
                    label: "Due",
                    render: (row) => formatDate(row.dueDate),
                  },
                  { key: "status", label: "Status" },
                ]}
              />
            ) : (
              <EmptyHint
                icon={History}
                title="No borrowing history"
                body="When you borrow books, they will appear here with dates and status."
                to="/dashboard/student/catalog"
                action="Find books to borrow"
              />
            )}
          </Panel>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
