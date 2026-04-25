import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const StatCard = ({ label, value, hint, icon: Icon = TrendingUp, tone = "orange", to, onClick }) => {
  const reduceMotion = useReducedMotion();

  const tones = {
    orange: "from-slate-100 to-white text-[color:var(--accent)]",
    green: "from-emerald-100 to-white text-emerald-700",
    blue: "from-sky-100 to-white text-sky-700",
    rose: "from-rose-100 to-white text-rose-700",
  };

  const cardClasses = `panel-card h-full bg-gradient-to-br shadow-sm transition-shadow duration-300 ${tones[tone] || tones.orange} ${
    to || onClick ? "cursor-pointer hover:shadow-md" : ""
  }`;

  const inner = (
    <motion.div
      layout
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cardClasses}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <motion.div
          className="rounded-2xl bg-white/80 p-3"
          whileHover={reduceMotion ? undefined : { scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2">
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group block h-full w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
      >
        {inner}
      </button>
    );
  }

  return inner;
};

export default StatCard;
