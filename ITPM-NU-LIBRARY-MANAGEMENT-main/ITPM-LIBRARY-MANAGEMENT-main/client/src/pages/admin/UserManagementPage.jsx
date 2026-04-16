import { useEffect, useMemo, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import DataTable from "../../components/common/DataTable";
import FormField from "../../components/common/FormField";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/format";
import {
  buildPhoneE164,
  getPasswordStrength,
  hasFieldErrors,
  initialAdminUserFieldErrors,
  phoneStorageToDigits,
  strengthToneClasses,
  validateAdminUserForm,
} from "../../utils/userFieldValidation";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "Student",
  status: "Active",
  phoneDigits: "",
  address: "",
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState(initialAdminUserFieldErrors());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const loadUsers = () => {
    libraryApi.users.list().then(({ data }) => setUsers(data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onChange = (event) => {
    const { name } = event.target;
    setForm((current) => ({ ...current, [name]: event.target.value }));
    const errKey = name === "phoneDigits" ? "phone" : name;
    setFieldErrors((current) => ({ ...current, [errKey]: "" }));
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

    const nextErrors = validateAdminUserForm(form, { isEdit: Boolean(editingId) });
    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      phone: buildPhoneE164(form.phoneDigits.replace(/\D/g, "")),
      address: form.address.trim(),
    };

    try {
      if (editingId) {
        if (form.password) {
          payload.password = form.password;
        }
        await libraryApi.users.update(editingId, payload);
      } else {
        payload.password = form.password;
        await libraryApi.users.create(payload);
      }

      setForm(initialForm);
      setFieldErrors(initialAdminUserFieldErrors());
      setEditingId(null);
      loadUsers();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Could not save user.");
    }
  };

  const editUser = (user) => {
    setEditingId(user._id);
    setFieldErrors(initialAdminUserFieldErrors());
    setError("");
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
      phoneDigits: phoneStorageToDigits(user.phone),
      address: user.address || "",
    });
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    await libraryApi.users.delete(id);
    loadUsers();
  };

  const selectErrorClass = (key) =>
    fieldErrors[key]
      ? "border-rose-400 ring-1 ring-rose-200 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/60 dark:ring-rose-900/40"
      : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title={editingId ? "Edit user" : "Create user"} subtitle="Admin-only user and role management">
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <FormField label="Name" name="name" value={form.name} onChange={onChange} error={fieldErrors.name} required />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            error={fieldErrors.email}
            required
          />
          <div>
            <FormField
              label={editingId ? "New password (optional)" : "Password"}
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              error={fieldErrors.password}
              required={!editingId}
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
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label-text">Role</span>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className={`input-field ${selectErrorClass("role")}`}
                aria-invalid={Boolean(fieldErrors.role)}
              >
                <option>Admin</option>
                <option>Librarian</option>
                <option>Student</option>
              </select>
              {fieldErrors.role ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{fieldErrors.role}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="label-text">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className={`input-field ${selectErrorClass("status")}`}
                aria-invalid={Boolean(fieldErrors.status)}
              >
                <option>Active</option>
                <option>Restricted</option>
                <option>Suspended</option>
              </select>
              {fieldErrors.status ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{fieldErrors.status}</p>
              ) : null}
            </label>
          </div>
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
                />
              </div>
            </label>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
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
            error={fieldErrors.address}
            required
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">
              {editingId ? "Update user" : "Create user"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                  setFieldErrors(initialAdminUserFieldErrors());
                  setError("");
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel title="Users" subtitle="All registered accounts in the system">
        <DataTable
          rows={users}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge value={row.status} />,
            },
            {
              key: "createdAt",
              label: "Joined",
              render: (row) => formatDate(row.createdAt),
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-3 py-2" onClick={() => editUser(row)}>
                    Edit
                  </button>
                  <button type="button" className="btn-secondary px-3 py-2" onClick={() => removeUser(row._id)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
};

export default UserManagementPage;
