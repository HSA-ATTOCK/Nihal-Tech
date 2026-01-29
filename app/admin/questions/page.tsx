import { prisma } from "@/lib/prisma";
import AdminQuestionsClient, { AdminQuestion } from "./AdminQuestionsClient";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const questions = await prisma.productQuestion.findMany({
    include: {
      product: true,
      user: true,
      answers: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped: AdminQuestion[] = questions.map(
    (q: {
      id: string;
      question: string;
      createdAt: Date;
      product?: { id: string; name: string } | null;
      user: { name: string | null; email: string | null } | null;
      answers: Array<{
        id: string;
        body: string;
        createdAt: Date;
        user: { name: string | null; email: string | null } | null;
      }>;
    }) => ({
      id: q.id,
      question: q.question,
      createdAt: q.createdAt.toISOString(),
      product: q.product ? { id: q.product.id, name: q.product.name } : null,
      user: q.user
        ? { name: q.user.name ?? null, email: q.user.email ?? null }
        : null,
      answers: q.answers.map(
        (a: {
          id: string;
          body: string;
          createdAt: Date;
          user: { name: string | null; email: string | null } | null;
        }) => ({
          id: a.id,
          body: a.body,
          createdAt: a.createdAt.toISOString(),
          user: a.user
            ? { name: a.user.name ?? null, email: a.user.email ?? null }
            : null,
        }),
      ),
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Questions</h1>
            <p className="text-slate-600 text-sm mt-1">
              Review customer questions, reply, and notify them by email.
            </p>
          </div>
        </div>

        {mapped.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No questions yet.
          </div>
        ) : (
          <AdminQuestionsClient initialQuestions={mapped} />
        )}
      </div>
    </div>
  );
}
