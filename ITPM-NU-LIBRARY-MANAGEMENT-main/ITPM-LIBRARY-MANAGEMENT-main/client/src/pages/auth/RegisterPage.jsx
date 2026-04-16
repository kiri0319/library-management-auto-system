import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import FormField from "../../components/common/FormField";
import {
  buildPhoneE164,
  getPasswordStrength,
  hasFieldErrors,
  initialUserFieldErrors,
  strengthToneClasses,
  validateRegisterForm,
} from "../../utils/userFieldValidation";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneDigits: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState(initialUserFieldErrors());
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const onChange = (event) => {
    const { name } = event.target;
    setForm((current) => ({ ...current, [name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const onPhoneDigitsChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 9);
    setForm((current) => ({ ...current, phoneDigits: digits }));
    setFieldErrors((current) => ({ ...current, phone: "" }));
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const nextErrors = validateRegisterForm(form);
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: buildPhoneE164(form.phoneDigits.replace(/\D/g, "")),
      address: form.address.trim(),
    };

    try {
      await register(payload);
      navigate("/dashboard/student", { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="landing-rise mb-3 flex items-center justify-center">
        <span className="inline-flex rounded-full bg-indigo-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-indigo-500">
          Join Us
        </span>
      </div>
      <h2 className="landing-rise landing-delay-1 text-center font-display text-4xl text-slate-900">Registration</h2>
      <p className="landing-rise landing-delay-1 mt-2 text-center text-sm text-slate-500">
        Create a student account with an instant digital membership ID.
      </p>

      <form className="landing-rise landing-delay-2 mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <FormField
          label="Full name"
          name="name"
          value={form.name}
          onChange={onChange}
          autoComplete="name"
          error={fieldErrors.name}
          required
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          autoComplete="email"
          error={fieldErrors.email}
          required
        />
        <div>
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            autoComplete="new-password"
            error={fieldErrors.password}
            required
          />
          {form.password ? (
            <div className="mt-2" aria-live="polite">
              <div
                className={`flex h-2 gap-1 overflow-hidden rounded-full p-0.5 ${
                  passwordStrength.tone === "none"
                    ? "bg-slate-100 dark:bg-slate-800"
                    : strengthToneClasses[passwordStrength.tone].track
                }`}
              >
                {[1, 2, 3, 4, 5].map((segment) => (
                  <div
                    key={segment}
                    className={`h-full min-w-0 flex-1 rounded-sm transition-colors duration-200 ${
                      segment <= passwordStrength.score
                        ? strengthToneClasses[passwordStrength.tone].bar
                        : "bg-white/60 dark:bg-slate-700/80"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`mt-1.5 text-xs font-semibold ${
                  passwordStrength.tone === "none"
                    ? "text-slate-500"
                    : strengthToneClasses[passwordStrength.tone].text
                }`}
              >
                {passwordStrength.label}
              </p>
            </div>
          ) : null}
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Strong password: 8+ characters with uppercase, lowercase, a number, and a special character (e.g. @ # $).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block">
              <span className="label-text">Phone (Sri Lanka)</span>
              <div
                className={`mt-1 flex w-full overflow-hidden rounded-lg border bg-white dark:bg-slate-900 ${
                  fieldErrors.phone
                    ? "border-rose-400 ring-1 ring-rose-200 dark:border-rose-500/60 dark:ring-rose-900/40"
                    : "border-slate-200 dark:border-slate-600"
                }`}
              >
                <span className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  +94
                </span>
                <input
                  name="phoneDigits"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="771234567"
                  value={form.phoneDigits}
                  onChange={onPhoneDigitsChange}
                  maxLength={9}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby="phone-hint"
                />
              </div>
            </label>
            <p id="phone-hint" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              +94 is fixed. Enter the remaining 9 digits only (e.g. 771234567).
            </p>
            {fieldErrors.phone ? (
              <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{fieldErrors.phone}</p>
            ) : null}
          </div>
          <FormField
            label="Address"
            name="address"
            as="textarea"
            rows={3}
            value={form.address}
            onChange={onChange}
            placeholder="e.g. Meesalai, Jaffna or street, district"
            autoComplete="street-address"
            error={fieldErrors.address}
            required
          />
        </div>

        {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}

        <button type="submit" className="btn-primary mt-4 w-full shadow-lg shadow-indigo-200/50">
          Create account
        </button>
      </form>

      <p className="landing-rise landing-delay-3 mt-6 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link
          to="/login"
          className="font-semibold text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-strong)]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
