import { Outlet, Link } from "react-router-dom";

const AUTH_BG = `${import.meta.env.BASE_URL}hero-library.png`;

const AuthLayout = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
    <div
      className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
      style={{ backgroundImage: `url('${AUTH_BG}')` }}
      aria-hidden
    />
    <div className="absolute inset-0 -z-10 bg-slate-950/55 backdrop-blur-[1px]" aria-hidden />
    <div
      className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-950/70 via-slate-900/50 to-slate-950/75"
      aria-hidden
    />

    <div className="app-shell relative z-10 w-full max-w-[28rem] py-10">
      <div className="landing-rise w-full rounded-[2.5rem] border border-white/85 bg-white/90 p-8 shadow-[0_24px_50px_-12px_rgba(11,22,84,0.25)] backdrop-blur-xl sm:p-10 dark:border-slate-600/80 dark:bg-slate-900/90">
        <Outlet />
        <div className="landing-rise landing-delay-3 mt-8 border-t border-slate-200/60 pt-6 text-center text-sm text-slate-500">
          Need the product overview?{" "}
          <Link to="/" className="font-semibold text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-strong)]">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;

