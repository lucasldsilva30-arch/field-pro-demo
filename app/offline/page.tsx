export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--erp-page-bg)] px-4 text-[var(--erp-page-fg)]">
      <section className="max-w-xl rounded-3xl border border-[color:var(--erp-border)] bg-[var(--erp-surface)] p-8 text-center shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-500">Field Pro</p>
        <h1 className="mt-3 text-3xl font-black">Você está offline</h1>
        <p className="mt-3 text-sm leading-7 text-[color:var(--erp-muted)]">
          O sistema foi instalado com suporte offline. Conecte-se à internet para sincronizar os dados novamente.
        </p>
      </section>
    </main>
  );
}
