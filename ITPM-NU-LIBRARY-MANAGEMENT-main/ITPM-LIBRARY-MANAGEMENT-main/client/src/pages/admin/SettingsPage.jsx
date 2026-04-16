import { useEffect, useState } from "react";
import { libraryApi } from "../../api/libraryApi";
import Panel from "../../components/common/Panel";
import FormField from "../../components/common/FormField";

const SettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    libraryApi.settings.list().then(({ data }) => setSettings(data));
  }, []);

  const onChange = (id, value) => {
    setSettings((current) => current.map((item) => (item._id === id ? { ...item, value } : item)));
  };

  const onSave = async (setting) => {
    await libraryApi.settings.update(setting._id, {
      ...setting,
      value: Number(setting.value),
    });
    setMessage(`${setting.label} updated.`);
    setTimeout(() => setMessage(""), 1800);
  };

  return (
    <Panel title="System settings" subtitle="Admin controls for circulation defaults and reminders">
      {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}
      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
              <div>
                <h3 className="font-semibold text-slate-800">{setting.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{setting.description}</p>
              </div>
              <FormField
                label="Value"
                name={setting.key}
                type="number"
                value={setting.value}
                onChange={(event) => onChange(setting._id, event.target.value)}
              />
              <button type="button" className="btn-primary" onClick={() => onSave(setting)}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export default SettingsPage;

