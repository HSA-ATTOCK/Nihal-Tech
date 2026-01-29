"use client";

import { useMemo, useState } from "react";

export type AdminAnswer = {
  id: string;
  body: string;
  createdAt: string;
  user?: { name: string | null; email: string | null } | null;
};

export type AdminQuestion = {
  id: string;
  question: string;
  createdAt: string;
  product?: { id: string; name: string } | null;
  user?: { name: string | null; email: string | null } | null;
  answers: AdminAnswer[];
};

export default function AdminQuestionsClient({
  initialQuestions,
}: {
  initialQuestions: AdminQuestion[];
}) {
  const [questions, setQuestions] = useState<AdminQuestion[]>(initialQuestions);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  const unanswered = useMemo(
    () => questions.filter((q) => q.answers.length === 0),
    [questions],
  );

  const handleAnswer = async (questionId: string) => {
    const body = drafts[questionId]?.trim();
    if (!body) {
      setMessage("Please enter an answer first.");
      return;
    }
    setSubmitting((prev) => ({ ...prev, [questionId]: true }));
    setMessage(null);
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Could not submit answer");
      }
      const updated: AdminQuestion = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === updated.id ? updated : q)),
      );
      setDrafts((prev) => ({ ...prev, [questionId]: "" }));
      setMessage("Answer sent and customer notified.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not submit answer",
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const renderQuestion = (q: AdminQuestion) => {
    const hasAnswer = q.answers.length > 0;
    return (
      <div
        key={q.id}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {q.product?.name || "Product"}
            </p>
            <p className="text-lg font-semibold text-slate-900">
              Q: {q.question}
            </p>
            <p className="text-sm text-slate-600">
              Asked {new Date(q.createdAt).toLocaleString()} by{" "}
              {q.user?.name || q.user?.email || "customer"}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {hasAnswer ? "Answered" : "Awaiting answer"}
          </span>
        </div>

        {q.answers.length > 0 && (
          <div className="mt-3 space-y-2">
            {q.answers.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Answer</span>
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-800 mt-1">{a.body}</p>
                {a.user?.email && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    by {a.user.name || a.user.email}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!hasAnswer && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Answer this question
            </label>
            <textarea
              value={drafts[q.id] || ""}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1f4b99] focus:outline-none"
              placeholder="Type your answer"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleAnswer(q.id)}
                disabled={submitting[q.id]}
                className="rounded-full bg-[#1f4b99] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163a79] disabled:opacity-60"
              >
                {submitting[q.id] ? "Sending..." : "Send answer"}
              </button>
              <button
                type="button"
                onClick={() => setDrafts((prev) => ({ ...prev, [q.id]: "" }))}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      {unanswered.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Unanswered</p>
          <div className="space-y-3">
            {unanswered.map((q) => renderQuestion(q))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-900">All questions</p>
        <div className="space-y-3">
          {questions.map((q) => renderQuestion(q))}
        </div>
      </div>
    </div>
  );
}
