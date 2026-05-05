import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export default async function ProfilePage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const ctx = await createTRPCContext({
    headers: new Headers(await headers()),
  });
  const trpc = createCaller(ctx);
  const result = await trpc.search.byCode({ code });
  if (!result.kind || !result.target) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          {result.kind} profile
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{code}</h1>
      </header>
      <pre className="overflow-auto rounded-2xl border bg-white p-6 text-xs shadow-sm">
        {JSON.stringify(result.target, null, 2)}
      </pre>
    </main>
  );
}
