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

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState(null);
  const [errors, setErrors] = useState({ phone: "" });

  useEffect(() => {
    refreshUser().then((data) => {
      setProfile(data);
      setDetails(data);
    });
  }, []);

  const onChange = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (event.target.name === "phone" && errors.phone) {
      setErrors({ phone: "" });
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
    const phone = (profile?.phone || "").trim();

    if (phone && !SL_PHONE_RE.test(phone)) {
      setErrors({
        phone: "Phone number must be Sri Lankan format: +947XXXXXXXX or 07XXXXXXXX.",
      });
      return;
    }

    setErrors({ phone: "" });
    await libraryApi.users.updateProfile({
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      avatar: profile.avatar,
    });
    const updated = await refreshUser();
    setProfile(updated);
    setDetails(updated);
    setMessage("Profile updated successfully.");
    setTimeout(() => setMessage(""), 1800);
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
        </Panel>

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
    </div>
  );
};

export default ProfilePage;

