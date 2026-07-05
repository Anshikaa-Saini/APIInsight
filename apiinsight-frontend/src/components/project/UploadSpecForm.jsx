import { useState } from 'react';
import Button from '../common/Button';
import { uploadFileApi, uploadUrlApi } from '../../api/projectApi';

export default function UploadSpecForm({ onUploaded }) {
  const [activeTab, setActiveTab] = useState('file'); // "file" | "url"
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res =
        activeTab === 'file' ? await uploadFileApi(file) : await uploadUrlApi(url);
      onUploaded(res.data.project);
      setFile(null);
      setUrl('');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg">
      <div className="flex gap-4 mb-4 border-b border-slate-200">
        <TabButton active={activeTab === 'file'} onClick={() => setActiveTab('file')}>
          Upload File
        </TabButton>
        <TabButton active={activeTab === 'url'} onClick={() => setActiveTab('url')}>
          From URL
        </TabButton>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'file' ? (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Swagger / OpenAPI file (.json, .yaml, .yml)
            </label>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0
                file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Swagger / OpenAPI spec URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/openapi.json"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Parsing spec...' : 'Upload & Parse'}
        </Button>
      </form>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
        active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}
