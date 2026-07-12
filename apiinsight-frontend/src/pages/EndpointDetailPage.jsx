import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import TestCaseCard from "../components/testcase/TestCaseCard";
import { getEndpointApi } from "../api/endpointApi";
import {
  generateTestCasesForEndpointApi,
  listTestCasesApi,
} from "../api/testcaseApi";
import {
  executeEndpointApi,
  listExecutionsForEndpointApi,
} from "../api/executionApi";

export default function EndpointDetailPage() {
  const { endpointId } = useParams();
  const [endpoint, setEndpoint] = useState(null);
  const [testCases, setTestCases] = useState([]);
  // Keyed by testCase id -> most recent execution for that test case.
  const [latestExecutionByTestCase, setLatestExecutionByTestCase] = useState(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState("");

  useEffect(() => {
    loadData();
  }, [endpointId]);

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const [endpointRes, testCasesRes, executionsRes] = await Promise.all([
        getEndpointApi(endpointId),
        listTestCasesApi(endpointId),
        listExecutionsForEndpointApi(endpointId),
      ]);
      setEndpoint(endpointRes.data.endpoint);
      setTestCases(testCasesRes.data.testCases);
      setLatestExecutionByTestCase(
        indexLatestByTestCase(executionsRes.data.executions),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not load endpoint");
    } finally {
      setIsLoading(false);
    }
  }

  // Executions come back sorted most-recent-first, so the first one we see
  // per test case id is its latest result.
  function indexLatestByTestCase(executions) {
    const map = {};
    for (const execution of executions) {
      if (!map[execution.testCase]) {
        map[execution.testCase] = execution;
      }
    }
    return map;
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError("");
    try {
      const res = await generateTestCasesForEndpointApi(endpointId);
      setTestCases(res.data.testCases);
      setLatestExecutionByTestCase({}); // old test cases (and their results) are gone now
    } catch (err) {
      setGenerateError(
        err.response?.data?.message || "Test case generation failed",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRunTests() {
    setIsRunning(true);
    setRunError("");
    try {
      const res = await executeEndpointApi(endpointId);
      setLatestExecutionByTestCase(indexLatestByTestCase(res.data.executions));
    } catch (err) {
      setRunError(err.response?.data?.message || "Test execution failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/dashboard"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Back to dashboard
        </Link>

        {isLoading ? (
          <p className="mt-6 text-slate-400">Loading...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mt-4">
              <Badge>{endpoint.method}</Badge>
              <h1 className="font-mono text-xl text-slate-900">
                {endpoint.path}
              </h1>
            </div>
            {endpoint.summary && (
              <p className="mt-2 text-slate-600">{endpoint.summary}</p>
            )}

            <Section title="Parameters">
              {endpoint.parameters.length === 0 ? (
                <EmptyNote>No parameters</EmptyNote>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">In</th>
                      <th className="py-2 pr-4 font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map((param) => (
                      <tr
                        key={param.name}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-4 font-mono">{param.name}</td>
                        <td className="py-2 pr-4">{param.in}</td>
                        <td className="py-2 pr-4">
                          {param.required ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="Request Body Schema">
              {Object.keys(endpoint.requestBodySchema || {}).length === 0 ? (
                <EmptyNote>No request body</EmptyNote>
              ) : (
                <JsonBlock data={endpoint.requestBodySchema} />
              )}
            </Section>

            <Section title="Responses">
              {Object.keys(endpoint.responses || {}).length === 0 ? (
                <EmptyNote>No responses defined</EmptyNote>
              ) : (
                <JsonBlock data={endpoint.responses} />
              )}
            </Section>

            <div className="flex items-center justify-between mt-8 mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                AI Test Cases ({testCases.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleRunTests}
                  disabled={isRunning || testCases.length === 0}
                  className="w-auto px-4 py-1.5"
                >
                  {isRunning ? "Running..." : "Run Tests"}
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-auto px-4 py-1.5"
                >
                  {isGenerating
                    ? "Generating..."
                    : testCases.length > 0
                      ? "Regenerate"
                      : "Generate Test Cases"}
                </Button>
              </div>
            </div>

            {generateError && (
              <p className="mb-3 text-sm text-red-600">{generateError}</p>
            )}
            {runError && (
              <p className="mb-3 text-sm text-red-600">{runError}</p>
            )}

            {testCases.length === 0 ? (
              <EmptyNote>
                No test cases yet — click &quot;Generate Test Cases&quot; to
                have AI create some.
              </EmptyNote>
            ) : (
              <div className="space-y-2">
                {testCases.map((testCase) => (
                  <TestCaseCard
                    key={testCase._id}
                    testCase={testCase}
                    execution={latestExecutionByTestCase[testCase._id]}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyNote({ children }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

function JsonBlock({ data }) {
  return (
    <pre className="p-4 overflow-x-auto text-xs bg-slate-900 text-slate-100 rounded-lg">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
