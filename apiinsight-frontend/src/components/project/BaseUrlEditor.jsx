import { useState } from 'react';
import Button from '../common/Button';

export default function BaseUrlEditor({ baseUrl, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(baseUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setIsSaving(true);
    setError('');
    try {
      await onSave(value);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save base URL');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 mt-1 text-sm">
        <span className="text-slate-500">Target base URL:</span>
        {baseUrl ? (
          <span className="font-mono text-slate-700">{baseUrl}</span>
        ) : (
          <span className="text-amber-600">Not set — tests can&apos;t run yet</span>
        )}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-slate-500 hover:underline"
        >
          {baseUrl ? 'Edit' : 'Set base URL'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://api.example.com"
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-mono
            focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <Button onClick={handleSave} disabled={isSaving} className="w-auto px-3 py-1.5">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setValue(baseUrl || '');
            setError('');
          }}
          className="text-sm text-slate-500 hover:underline"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
