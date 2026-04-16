const EmptyState = ({ title, description }) => (
  <div className="panel-muted text-center">
    <h3 className="font-display text-2xl">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
  </div>
);

export default EmptyState;

