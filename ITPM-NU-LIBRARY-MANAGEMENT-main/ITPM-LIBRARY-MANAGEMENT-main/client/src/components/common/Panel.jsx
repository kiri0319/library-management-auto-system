const Panel = ({ title, subtitle, action, children }) => (
  <section className="panel-card">
    {(title || action) && (
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title ? <h2 className="font-display text-2xl">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export default Panel;

