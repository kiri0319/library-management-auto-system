const LoadingState = ({ text = "Loading..." }) => (
  <div className="panel-card">
    <div className="flex items-center gap-3">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-100 border-t-[color:var(--accent)]" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  </div>
);

export default LoadingState;

