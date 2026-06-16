"use client";

import { useState } from "react";
import { ErpShell } from "@/components/erp-shell";

export default function SegurancaPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "A confirmação não confere com a nova senha." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao redefinir senha.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Senha redefinida com sucesso." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao redefinir senha." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ErpShell active="seguranca">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-black p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-yellow-500">Segurança</p>
          <h1 className="mt-2 text-3xl font-black text-white">Redefinir senha</h1>
          <p className="mt-2 text-sm text-slate-400">Use esta tela para alterar a senha de acesso do ERP.</p>
        </header>

        <form className="rounded-3xl border border-white/10 bg-black p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <PasswordField label="Senha atual" onChange={setCurrentPassword} value={currentPassword} />
            <PasswordField label="Nova senha" onChange={setNewPassword} value={newPassword} />
            <PasswordField label="Confirmar nova senha" onChange={setConfirmPassword} value={confirmPassword} />
          </div>

          {message ? (
            <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
              {message.text}
            </p>
          ) : null}

          <button className="mt-5 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-black disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </section>
    </ErpShell>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-yellow-500"
        onChange={(event) => onChange(event.target.value)}
        type="password"
        value={value}
      />
    </label>
  );
}
