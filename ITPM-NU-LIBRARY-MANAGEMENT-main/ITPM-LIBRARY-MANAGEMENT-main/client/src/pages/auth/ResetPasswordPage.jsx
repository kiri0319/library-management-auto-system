import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { libraryApi } from "../../api/libraryApi";
import FormField from "../../components/common/FormField";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const { data } = await libraryApi.auth.resetPassword(form);
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Reset failed.");
    }
  };

  return (
    <div>
      <h2 className="font-display text-4xl">Reset password</h2>
      <p className="mt-2 text-sm text-slate-500">Use the OTP sent to your email and choose a new password.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FormField label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
        <FormField label="OTP code" name="otp" value={form.otp} onChange={onChange} required />
        <FormField label="New password" name="newPassword" type="password" value={form.newPassword} onChange={onChange} required />
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button type="submit" className="btn-primary w-full">
          Update password
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        Return to{" "}
        <Link to="/login" className="font-semibold text-[color:var(--accent)]">
          sign in
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;

