import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/common/FormField";

const roleDashboardPath = {
  Admin: "/dashboard/admin",
  Librarian: "/dashboard/librarian",
  Student: "/dashboard/student",
};

const LoginPage = ({ roleHint }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const title = roleHint ? `${roleHint} sign in` : "Sign in";
  const subtitle = roleHint
    ? `Sign in with your ${roleHint.toLowerCase()} account to open your dashboard.`
    : "Access admin, librarian, or student dashboards.";

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await login(form);
      if (roleHint && response.role !== roleHint) {
        setError(`This page is only for ${roleHint.toLowerCase()} accounts.`);
        return;
      }

      const nextPath =
        roleDashboardPath[response.role] || location.state?.from?.pathname || "/dashboard/student";
      navigate(nextPath, { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="landing-rise mb-3 flex items-center justify-center">
        <span className="inline-flex rounded-full bg-indigo-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-indigo-500">
          Welcome Back
        </span>
      </div>
      <h2 className="landing-rise landing-delay-1 text-center font-display text-4xl text-slate-900">{title}</h2>
      <p className="landing-rise landing-delay-1 mt-2 text-center text-sm text-slate-500">
        {subtitle}
      </p>
      {!roleHint ? (
        <div className="landing-rise landing-delay-1 mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <Link to="/login/admin" className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700">
            Admin login
          </Link>
          <Link
            to="/login/librarian"
            className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700"
          >
            Librarian login
          </Link>
        </div>
      ) : null}
      
      <form className="landing-rise landing-delay-2 mt-8 space-y-5" onSubmit={onSubmit}>
        <FormField label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
        {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}
        
        <button type="submit" className="btn-primary mt-2 w-full shadow-lg shadow-indigo-200/50">
          Sign In
        </button>
      </form>
      
      <div className="landing-rise landing-delay-3 mt-6 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-strong)] transition-colors">
          Forgot password?
        </Link>
        {roleHint ? (
          <Link to="/login" className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Back to all logins
          </Link>
        ) : (
          <Link to="/register" className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Create student account
          </Link>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

