export default function Input({ label, type = 'text', value, onChange, name, placeholder }) {
  return (
    <label className="block mb-4 text-left">
      <span className="block mb-1 text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
