import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import RiskScoreGauge from '../components/report/RiskScoreGauge';
import SummaryPanel from '../components/report/SummaryPanel';
import SuggestionList from '../components/report/SuggestionList';
import { generateReportApi, getLatestReportApi, getReportHistoryApi } from '../api/reportApi';

export default function ReportPage() {
  const { projectId } = useParams();
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setIsLoading(true);
    setLoadError('');
    try {
      const [reportResult, historyRes] = await Promise.all([
        getLatestReportApi(projectId).catch((err) => {
          // No report generated yet is an expected state, not an error.
          if (err.response?.status === 404) return null;
          throw err;
        }),
        getReportHistoryApi(projectId),
      ]);
      setReport(reportResult?.data?.report || null);
      setHistory(historyRes.data.reports);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load report');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError('');
    try {
      const res = await generateReportApi(projectId);
      setReport(res.data.report);
      const historyRes = await getReportHistoryApi(projectId);
      setHistory(historyRes.data.reports);
    } catch (err) {
      setGenerateError(err.response?.data?.message || 'Report generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to={`/projects/${projectId}`} className="text-sm text-slate-500 hover:underline">
          ← Back to project
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Quality Report</h1>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-auto px-4 py-1.5"
          >
            {isGenerating ? 'Generating...' : report ? 'Regenerate Report' : 'Generate Report'}
          </Button>
        </div>

        {generateError && <p className="mb-4 text-sm text-red-600">{generateError}</p>}

        {isLoading ? (
          <p className="text-slate-400">Loading...</p>
        ) : loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : !report ? (
          <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
            No report yet — run some tests, then click &quot;Generate Report&quot;.
          </div>
        ) : (
          <>
            <RiskScoreGauge riskScore={report.riskScore} riskLevel={report.riskLevel} />

            <p className="mt-4 mb-6 text-sm text-slate-500">
              {report.passedCount}/{report.totalTestCases} test cases passed across{' '}
              {report.totalEndpoints} endpoints.
            </p>

            <div className="space-y-4">
              <SummaryPanel summary={report.aiSummary} />
              <SuggestionList suggestions={report.suggestions} />
            </div>

            {history.length > 1 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Report History
                </h2>
                <div className="space-y-1">
                  {history.map((pastReport) => (
                    <button
                      key={pastReport._id}
                      onClick={() => setReport(pastReport)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-md
                        ${pastReport._id === report._id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-slate-600">
                        {new Date(pastReport.generatedAt).toLocaleString()}
                      </span>
                      <span className="font-mono text-slate-900">
                        {pastReport.riskScore}/100 · {pastReport.riskLevel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
