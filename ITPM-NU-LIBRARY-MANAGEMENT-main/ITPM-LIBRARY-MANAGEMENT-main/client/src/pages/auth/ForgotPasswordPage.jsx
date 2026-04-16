import { useState } from "react";
import { Link } from "react-router-dom";
import { libraryApi } from "../../api/libraryApi";
import FormField from "../../components/common/FormField";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const { data } = await libraryApi.auth.forgotPassword({ email });
      setMessage(
        data.otpPreview
          ? `${data.message} Dev OTP preview: ${data.otpPreview}`
          : data.message
      );
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Could not request OTP.");
    }
  };

  return (
    <div>
      <h2 className="font-display text-4xl">Forgot password</h2>
      <p className="mt-2 text-sm text-slate-500">Request a one-time code to reset your password.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FormField label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button type="submit" className="btn-primary w-full">
          Send OTP
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500">
        Have the code already?{" "}
        <Link to="/reset-password" className="font-semibold text-[color:var(--accent)]">
          Reset password
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;

