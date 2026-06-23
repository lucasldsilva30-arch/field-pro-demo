import Link from "next/link";
import { ErpShell } from "@/components/erp-shell";

const privacyText = `Termos de Uso e Política de Privacidade

1. Propósito e Confidencialidade
O sistema Field Pro é uma demonstração de ferramenta de gestão operacional. Os dados apresentados são fictícios e servem exclusivamente para avaliação do produto.

2. Responsabilidade do Usuário
O acesso ao sistema é pessoal e intransferível. O usuário é responsável por manter a segurança de suas credenciais de login. É estritamente proibido o compartilhamento de acessos ou a exportação de dados para fins não autorizados pela gestão.

3. Segurança dos Dados
Nos comprometemos a manter a integridade das informações através de práticas de segurança de rede e armazenamento seguro. A demonstração não contém dados de clientes reais.

4. Conformidade e Uso
Ao utilizar este sistema, você concorda que o uso está em conformidade com as políticas internas da empresa. O acesso contínuo à plataforma pressupõe a aceitação destes termos.`;

export default function PrivacidadePage() {
  return (
    <ErpShell active="privacidade">
      <section className="privacy-page mx-auto w-full max-w-4xl space-y-6 px-2 py-2 sm:px-4 lg:px-6">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-[rgba(255,215,0,0.16)] bg-[#121212] p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-yellow-400">Privacidade</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Termos e Privacidade</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Documento de referência da demonstração Field Pro e suas regras de uso.
              </p>
            </div>

            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-[rgba(255,215,0,0.24)] bg-yellow-400 px-4 py-2.5 text-sm font-black text-black transition hover:bg-yellow-300"
              href="/dashboard"
              data-demo-nav="true"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </header>

        <article className="rounded-[1.75rem] border border-white/10 bg-black p-5 shadow-2xl shadow-black/30 sm:p-6 lg:p-8">
          <pre className="whitespace-pre-wrap break-words text-[15px] leading-8 text-zinc-200">{privacyText}</pre>
        </article>
      </section>
    </ErpShell>
  );
}
