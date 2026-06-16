"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Senha invÃ¡lida.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "NÃ£o foi possÃ­vel entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-black px-4 text-slate-50">
      <form
        className="w-full max-w-sm rounded-2xl border border-yellow-950/70 bg-zinc-950 p-8 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <p className="text-lg font-extrabold leading-none text-yellow-400">FIELD PRO</p>
        <h1 className="mt-8 text-2xl font-extrabold">Acesso ao ERP</h1>
        <p className="mt-2 text-sm text-slate-400">Digite a senha administrativa para continuar.</p>

        <label className="mt-6 block text-sm font-semibold text-slate-300" htmlFor="password">
          Senha
        </label>
        <input
          className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black px-4 text-slate-100 outline-none focus:border-yellow-500/70"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />

        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <button
          className="mt-6 h-12 w-full rounded-lg bg-gradient-to-r from-yellow-300 to-yellow-700 font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

