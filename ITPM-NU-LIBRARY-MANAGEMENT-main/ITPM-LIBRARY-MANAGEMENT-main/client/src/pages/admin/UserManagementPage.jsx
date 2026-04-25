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
  const [pendingAdminAction, setPendingAdminAction] = useState(null);
  const [adminOtp, setAdminOtp] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFilters, setUserFilters] = useState({ search: "", role: "All", status: "All" });

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
        await libraryApi.users.sendAdminActionOtp({
          action: "update",
          targetUserId: editingId,
        });
        if (form.password) {
          payload.password = form.password;
        }
        setPendingAdminAction({
          action: "update",
          targetUserId: editingId,
          payload,
        });
        setAdminOtp("");
        setInfoMessage("Verification OTP sent to the selected user's email. Enter OTP below to complete update.");
        return;
      } else {
        payload.password = form.password;
        await libraryApi.users.create(payload);
      }

      setForm(initialForm);
      setFieldErrors(initialAdminUserFieldErrors());
      setEditingId(null);
      setPendingAdminAction(null);
      setAdminOtp("");
      setInfoMessage("");
      loadUsers();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Could not save user.");
    }
  };

  const editUser = (user) => {
    setShowUserForm(true);
    setEditingId(user._id);
    setFieldErrors(initialAdminUserFieldErrors());
    setError("");
    setInfoMessage("");
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

    try {
      await libraryApi.users.sendAdminActionOtp({
        action: "delete",
        targetUserId: id,
      });
      setPendingAdminAction({
        action: "delete",
        targetUserId: id,
      });
      setAdminOtp("");
      setInfoMessage("Verification OTP sent to the selected user's email. Enter OTP below to complete delete.");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Could not delete user.");
    }
  };

  const completeAdminAction = async () => {
    if (!pendingAdminAction) {
      return;
    }
    if (!adminOtp.trim()) {
      setError("OTP is required.");
      return;
    }

    try {
      if (pendingAdminAction.action === "update") {
        await libraryApi.users.update(pendingAdminAction.targetUserId, {
          ...pendingAdminAction.payload,
          otp: adminOtp.trim(),
        });
        setForm(initialForm);
        setFieldErrors(initialAdminUserFieldErrors());
        setEditingId(null);
      } else {
        await libraryApi.users.delete(pendingAdminAction.targetUserId, { otp: adminOtp.trim() });
      }
      setPendingAdminAction(null);
      setAdminOtp("");
      setInfoMessage("");
      setError("");
      loadUsers();
    } catch (actionError) {
      setError(actionError.response?.data?.message || "Could not verify OTP.");
    }
  };

  const selectErrorClass = (key) =>
    fieldErrors[key]
      ? "border-rose-400 ring-1 ring-rose-200 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/60 dark:ring-rose-900/40"
      : "";

  const filteredUsers = useMemo(() => {
    const search = userFilters.search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !search || [user.name, user.email].some((value) => String(value || "").toLowerCase().includes(search));
      const matchesRole = userFilters.role === "All" || user.role === userFilters.role;
      const matchesStatus = userFilters.status === "All" || user.status === userFilters.status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userFilters]);

  return (
    <div className={`grid gap-6 ${showUserForm ? "xl:grid-cols-[0.9fr_1.1fr]" : ""}`}>
      {showUserForm ? (
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
          {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {pendingAdminAction ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <p className="mb-2 text-sm font-medium text-indigo-800">
                Enter OTP to confirm {pendingAdminAction.action === "update" ? "user update" : "user deletion"}.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <FormField
                  label="Verification OTP"
                  name="adminOtp"
                  value={adminOtp}
                  onChange={(event) => setAdminOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                />
                <button type="button" className="btn-primary" onClick={completeAdminAction}>
                  Verify and continue
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setPendingAdminAction(null);
                    setAdminOtp("");
                    setInfoMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
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
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowUserForm(false);
                setEditingId(null);
                setForm(initialForm);
                setFieldErrors(initialAdminUserFieldErrors());
                setPendingAdminAction(null);
                setAdminOtp("");
                setInfoMessage("");
                setError("");
              }}
            >
              Close form
            </button>
          </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Users" subtitle="All registered accounts in the system">
        <div className="mb-4">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setShowUserForm(true);
              setEditingId(null);
              setForm(initialForm);
              setFieldErrors(initialAdminUserFieldErrors());
              setPendingAdminAction(null);
              setAdminOtp("");
              setInfoMessage("");
              setError("");
            }}
          >
            Create user
          </button>
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            className="input-field"
            placeholder="Search by name or email"
            value={userFilters.search}
            onChange={(event) => setUserFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select
            className="input-field"
            value={userFilters.role}
            onChange={(event) => setUserFilters((current) => ({ ...current, role: event.target.value }))}
          >
            <option value="All">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Librarian">Librarian</option>
            <option value="Student">Student</option>
          </select>
          <select
            className="input-field"
            value={userFilters.status}
            onChange={(event) => setUserFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Restricted">Restricted</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <DataTable
          rows={filteredUsers}
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
