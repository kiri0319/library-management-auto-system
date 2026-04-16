import { NavLink } from "react-router-dom";
import { navigationByRole } from "../../utils/navigation";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = () => {
  const { user } = useAuth();
  const navigation = navigationByRole[user?.role] || [];

  return (
    <aside className="panel-card h-fit lg:sticky lg:top-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">LibrarySphere</p>
        <h2 className="mt-2 font-display text-3xl text-[color:var(--ink)]">Stacks & Signals</h2>
        <p className="mt-2 text-sm text-slate-500">Role-aware workspace for daily library operations.</p>
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[color:var(--ink)] text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[color:var(--ink)]"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

