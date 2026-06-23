"use client";

import type { MaterialDraft } from "@/hooks/useMateriais";
import type { MaterialStatus } from "@/lib/types";

type MaterialFormPanelProps = {
  draft: MaterialDraft;
  editing: boolean;
  onChange: (field: keyof MaterialDraft, value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

const materialStatusOptions: MaterialStatus[] = ["Disponivel", "Baixo estoque", "Sem estoque", "Manutencao"];

export function MaterialFormPanel({ draft, editing, onChange, onClear, onSubmit, onCancelEdit }: MaterialFormPanelProps) {
  return (
    <section data-material-form className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
      <div className="border-b border-white/10 pb-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-500">Cadastro</p>
        <h2 className="mt-2 text-xl font-black text-white">{editing ? "Editar material" : "Novo material"}</h2>
        <p className="mt-1 text-sm text-slate-400">
          Adicione estoque mínimo, rastreio e observações para manter o inventário mais inteligente.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Field label="Material">
          <input value={draft.material} onChange={(event) => onChange("material", event.target.value)} />
        </Field>
        <Field label="Categoria">
          <input value={draft.categoria} onChange={(event) => onChange("categoria", event.target.value)} />
        </Field>
        <Field label="Unidade">
          <input value={draft.unidade} onChange={(event) => onChange("unidade", event.target.value)} />
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(event) => onChange("status", event.target.value)}>
            {materialStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estoque">
          <input inputMode="decimal" type="number" value={draft.estoque} onChange={(event) => onChange("estoque", event.target.value)} />
        </Field>
        <Field label="Estoque mínimo">
          <input inputMode="decimal" type="number" value={draft.estoqueMinimo} onChange={(event) => onChange("estoqueMinimo", event.target.value)} />
        </Field>
        <Field label="Utilizado">
          <input inputMode="decimal" type="number" value={draft.utilizado} onChange={(event) => onChange("utilizado", event.target.value)} />
        </Field>
        <Field label="Local">
          <input value={draft.local} onChange={(event) => onChange("local", event.target.value)} />
        </Field>
        <Field label="Responsável">
          <input value={draft.responsavel} onChange={(event) => onChange("responsavel", event.target.value)} />
        </Field>
        <Field label="Observações">
          <input value={draft.observacoes} onChange={(event) => onChange("observacoes", event.target.value)} />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-extrabold text-black" onClick={onSubmit} type="button">
          {editing ? "Salvar alterações" : "Adicionar material"}
        </button>
        {editing ? (
          <button className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300" onClick={onCancelEdit} type="button">
            Cancelar edição
          </button>
        ) : null}
        <button className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300" onClick={onClear} type="button">
          Limpar formulário
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <div className="[&>input]:mt-2 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-white/10 [&>input]:bg-black [&>input]:px-3 [&>input]:py-3 [&>input]:text-sm [&>input]:text-white [&>select]:mt-2 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-white/10 [&>select]:bg-black [&>select]:px-3 [&>select]:py-3 [&>select]:text-sm [&>select]:text-white">
        {children}
      </div>
    </label>
  );
}
