export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

export const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export const getBadgeClass = (value) => {
  const palette = {
    Active: "bg-emerald-100 text-emerald-700",
    Available: "bg-emerald-100 text-emerald-700",
    Good: "bg-emerald-100 text-emerald-700",
    Paid: "bg-emerald-100 text-emerald-700",
    Success: "bg-emerald-100 text-emerald-700",
    Returned: "bg-emerald-100 text-emerald-700",
    Repair: "bg-amber-100 text-amber-700",
    Queued: "bg-amber-100 text-amber-700",
    "Limited Stock": "bg-amber-100 text-amber-700",
    Warning: "bg-amber-100 text-amber-700",
    Restricted: "bg-amber-100 text-amber-700",
    Medium: "bg-amber-100 text-amber-700",
    Damaged: "bg-rose-100 text-rose-700",
    Old: "bg-rose-100 text-rose-700",
    Replace: "bg-rose-100 text-rose-700",
    Overdue: "bg-rose-100 text-rose-700",
    Suspended: "bg-rose-100 text-rose-700",
    Unpaid: "bg-rose-100 text-rose-700",
    High: "bg-rose-100 text-rose-700",
    Cancelled: "bg-slate-200 text-slate-700",
    "Out of Stock": "bg-slate-300 text-slate-700",
    Notified: "bg-sky-100 text-sky-700",
    Collected: "bg-sky-100 text-sky-700",
    Low: "bg-slate-100 text-slate-700",
  };

  return palette[value] || "bg-slate-100 text-slate-700";
};
