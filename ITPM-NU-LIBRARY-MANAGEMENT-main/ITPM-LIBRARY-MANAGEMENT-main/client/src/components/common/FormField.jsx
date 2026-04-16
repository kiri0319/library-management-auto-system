const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  as = "input",
  rows = 4,
  required = false,
  error,
  autoComplete,
}) => {
  const sharedProps = {
    name,
    value,
    onChange,
    placeholder,
    required,
    autoComplete,
    className: `input-field ${error ? "border-rose-400 ring-1 ring-rose-200 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/60 dark:ring-rose-900/40" : ""}`,
  };

  return (
    <label className="block">
      <span className="label-text">{label}</span>
      {as === "textarea" ? <textarea {...sharedProps} rows={rows} /> : <input {...sharedProps} type={type} />}
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
    </label>
  );
};

export default FormField;

