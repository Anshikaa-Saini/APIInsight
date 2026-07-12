import { useState } from "react";
import Badge from "../common/Badge";

export default function TestCaseCard({ testCase, execution }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge>{testCase.category}</Badge>
          <span className="text-sm text-slate-800 truncate">
            {testCase.title}
          </span>
          {execution && <Badge>{execution.passed ? "passed" : "failed"}</Badge>}
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          expects {testCase.expectedStatusCode} {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <p className="mt-3 text-sm text-slate-600">
            {testCase.expectedBehaviour}
          </p>
          <p className="mt-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Request Payload
          </p>
          <pre className="p-3 overflow-x-auto text-xs bg-slate-900 text-slate-100 rounded-lg">
            {JSON.stringify(testCase.requestPayload, null, 2)}
          </pre>

          {execution && (
            <>
              <p className="mt-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Last Run Result
              </p>
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  Actual status:{" "}
                  <span className="font-mono">
                    {execution.actualStatusCode ?? "no response"}
                  </span>
                  {" · "}
                  {execution.responseTimeMs != null
                    ? `${execution.responseTimeMs}ms`
                    : ""}
                </p>
                {execution.errorMessage && (
                  <p className="text-red-600">{execution.errorMessage}</p>
                )}
              </div>
              {execution.actualResponseBody != null && (
                <>
                  <p className="mt-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actual Response Body
                  </p>
                  <pre className="p-3 overflow-x-auto text-xs bg-slate-900 text-slate-100 rounded-lg">
                    {JSON.stringify(execution.actualResponseBody, null, 2)}
                  </pre>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
