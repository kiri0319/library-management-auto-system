import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { libraryApi } from "../../api/libraryApi";
import BookCoverCell from "../../components/books/BookCoverCell";
import MembershipCard from "../../components/qr/MembershipCard";
import Panel from "../../components/common/Panel";
import FormField from "../../components/common/FormField";
import DataTable from "../../components/common/DataTable";
import { formatDate } from "../../utils/format";

const SL_PHONE_RE = /^(?:\+94|0)7\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const normalizeSLPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  // 07XXXXXXXX -> +947XXXXXXXX
  if (digits.length === 10 && digits.startsWith("07")) {
    return `+94${digits.slice(1)}`;
  }
  // 947XXXXXXXX -> +947XXXXXXXX
  if (digits.length === 11 && digits.startsWith("94")) {
    return `+${digits}`;
  }
  // already +94 and valid digits
  if (raw.startsWith("+94") && digits.length === 11) {
    return `+${digits}`;
  }
  return raw.replace(/\s+/g, "");
};

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState(null);
  const [errors, setErrors] = useState({ phone: "", email: "" });
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailVerifyStep, setEmailVerifyStep] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteVerifyStep, setDeleteVerifyStep] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    refreshUser()
      .then((data) => {
        const normalized = { ...data, phone: normalizeSLPhone(data?.phone) };
        setProfile(normalized);
        setDetails(data);
        setPendingEmail(data?.pendingEmail || "");
        if (data?.pendingEmail) {
          setEmailVerifyStep(true);
        }
      })
      .catch((error) => {
        console.error("Failed to load profile:", error);
        setMessage("Failed to load profile data.");
      });
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: name === "phone" ? normalizeSLPhone(value) : value }));
    if (name === "phone" && errors.phone) {
      setErrors((current) => ({ ...current, phone: "" }));
    }
    if (name === "email" && errors.email) {
      setErrors((current) => ({ ...current, email: "" }));
    }
  };

  const onAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({ ...current, avatar: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const phone = normalizeSLPhone(profile?.phone || "");
    const email = (profile?.email || "").trim();

    if (email && !EMAIL_RE.test(email)) {
      setErrors((current) => ({ ...current, email: "Enter a valid email address." }));
      return;
    }

    if (phone && !SL_PHONE_RE.test(phone)) {
      setErrors((current) => ({
        ...current,
        phone: "Phone number must be Sri Lankan format: +947XXXXXXXX or 07XXXXXXXX.",
      }));
      return;
    }

    setErrors({ phone: "", email: "" });
    const updates = {
      name: profile.name,
      phone,
      address: profile.address,
      avatar: profile.avatar,
    };

    await libraryApi.users.updateProfile(updates);

    if (email !== user?.email) {
      await libraryApi.users.sendEmailChangeOtp({ email });
      setPendingEmail(email);
      setEmailVerifyStep(true);
      setOtpMessage("Verification OTP sent to your new email address.");
      setMessage("");
      return;
    }

    const updated = await refreshUser();
    setProfile({ ...updated, phone: normalizeSLPhone(updated?.phone) });
    setDetails(updated);
    setMessage("Profile updated successfully.");
    setTimeout(() => setMessage(""), 1800);
  };

  const onVerifyEmailOtp = async (event) => {
    event.preventDefault();
    if (!emailOtp.trim()) {
      setOtpMessage("Enter the OTP sent to your new email.");
      return;
    }

    try {
      await libraryApi.users.verifyEmailChangeOtp({ otp: emailOtp.trim() });
      const updated = await refreshUser();
      setProfile(updated);
      setDetails(updated);
      setPendingEmail("");
      setEmailVerifyStep(false);
      setEmailOtp("");
      setMessage("Email updated successfully.");
      setOtpMessage("");
      setTimeout(() => setMessage(""), 1800);
    } catch (error) {
      setOtpMessage(error.response?.data?.message || "OTP verification failed.");
    }
  };

  const onRequestDeleteAccount = async () => {
    try {
      await libraryApi.users.sendDeleteAccountOtp();
      setDeleteVerifyStep(true);
      setDeleteMessage("Account deletion OTP sent to your email.");
    } catch (error) {
      setDeleteMessage(error.response?.data?.message || "Failed to send deletion OTP.");
    }
  };

  const onVerifyDeleteOtp = async (event) => {
    event.preventDefault();
    if (!deleteOtp.trim()) {
      setDeleteMessage("Enter the OTP sent to your email.");
      return;
    }

    try {
      await libraryApi.users.verifyDeleteAccountOtp({ otp: deleteOtp.trim() });
      // Account deleted, redirect to login
      window.location.href = "/login";
    } catch (error) {
      setDeleteMessage(error.response?.data?.message || "OTP verification failed.");
    }
  };


  return (
    <div className="space-y-6">
      <MembershipCard user={profile} />
      {message ? <div className="panel-card text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Profile settings" subtitle="Update personal details shown in the library system">
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField label="Full name" name="name" value={profile?.name || ""} onChange={onChange} />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={profile?.email || ""}
              onChange={onChange}
              error={errors.email}
              placeholder="you@example.com"
            />
            <FormField
              label="Phone"
              name="phone"
              value={profile?.phone || ""}
              onChange={onChange}
              error={errors.phone}
              placeholder="+94771234567 or 0771234567"
            />
            <FormField label="Address" name="address" value={profile?.address || ""} onChange={onChange} />
            <label className="block">
              <span className="label-text">Profile image</span>
              <input className="input-field" type="file" accept="image/*" onChange={onAvatarFileChange} />
              <p className="mt-1 text-xs text-slate-500">Choose an image from your system.</p>
            </label>
            {profile?.avatar ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                <img
                  src={profile.avatar}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              </div>
            ) : null}
            <button type="submit" className="btn-primary">
              Save profile
            </button>
          </form>
          {emailVerifyStep ? (
            <form className="space-y-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-slate-200" onSubmit={onVerifyEmailOtp}>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Verify new email</p>
              <p className="text-slate-600 dark:text-slate-300">
                A verification code was sent to <strong>{pendingEmail}</strong>. Enter it below to confirm the email change.
              </p>
              <FormField
                label="Verification code"
                name="emailOtp"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                placeholder="123456"
              />
              {otpMessage ? <p className="text-xs text-rose-600 dark:text-rose-400">{otpMessage}</p> : null}
              <button type="submit" className="btn-primary w-full">
                Verify email change
              </button>
            </form>
          ) : null}
        </Panel>

        <Panel title="Danger zone" subtitle="Irreversible account actions">
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-700/40 dark:bg-rose-950/20">
              <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">Delete Account</h3>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={onRequestDeleteAccount}
                className="mt-3 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                Delete Account
              </button>
            </div>
            {deleteVerifyStep ? (
              <form className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20" onSubmit={onVerifyDeleteOtp}>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Confirm Account Deletion</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  A verification code was sent to your email. Enter it below to permanently delete your account.
                </p>
                <FormField
                  label="Verification code"
                  name="deleteOtp"
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value)}
                  placeholder="123456"
                />
                {deleteMessage ? <p className="text-xs text-rose-600 dark:text-rose-400">{deleteMessage}</p> : null}
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    Confirm Deletion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteVerifyStep(false);
                      setDeleteOtp("");
                      setDeleteMessage("");
                    }}
                    className="rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel title="Reading history" subtitle="Recent borrowing history attached to your profile">
        <DataTable
          rows={details?.readingHistory || []}
          columns={[
            {
              key: "book",
              label: "Book",
              render: (row) => <BookCoverCell book={row.book} />,
            },
            {
              key: "borrowDate",
              label: "Borrowed",
              render: (row) => formatDate(row.borrowDate),
            },
            {
              key: "dueDate",
              label: "Due",
              render: (row) => formatDate(row.dueDate),
            },
            { key: "status", label: "Status" },
          ]}
        />
      </Panel>
    </div>
  );
};

export default ProfilePage;

