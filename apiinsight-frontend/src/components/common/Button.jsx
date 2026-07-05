export default function Button({ children, type = 'button', disabled, onClick, className = '' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white
        hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
