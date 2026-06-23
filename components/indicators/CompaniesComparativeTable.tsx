'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/calculator'
import type { CompanyName, ErpData } from '@/lib/types'
import { filterErpDataByCompany } from '@/lib/companies'

interface CompaniesComparativeTableProps {
  data: ErpData
  companies: CompanyName[]
  activeCompany: CompanyName
}

export function CompaniesComparativeTable({ data, companies, activeCompany }: CompaniesComparativeTableProps) {
  const companyMetrics = useMemo(() => {
    return companies.map((company) => {
      const companyData = filterErpDataByCompany(data, company)
      const production = companyData.production.length
      const finance = companyData.finance || []
      const entradas = finance.filter((e) => e.type === 'Entrada').reduce((sum, e) => sum + e.amount, 0)
      const saidas = finance.filter((e) => e.type === 'Saída').reduce((sum, e) => sum + e.amount, 0)
      const saldo = entradas - saidas
      const maxProduction = 100 // Reference for progress bar

      return {
        name: company,
        production,
        faturamento: entradas,
        despesas: saidas,
        saldo,
        productionPercent: (production / maxProduction) * 100,
      }
    })
  }, [data, companies])

  const maxProduction = Math.max(...companyMetrics.map((m) => m.production), 1)

  return (
    <section className="overflow-x-auto rounded-2xl border border-yellow-950/60 bg-zinc-950">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-yellow-950/40 bg-black/50">
          <tr>
            <th className="px-6 py-4 font-semibold text-slate-300">Empresa</th>
            <th className="px-6 py-4 font-semibold text-slate-300">Produção</th>
            <th className="px-6 py-4 font-semibold text-slate-300">Faturamento</th>
            <th className="px-6 py-4 font-semibold text-slate-300">Despesas</th>
            <th className="px-6 py-4 font-semibold text-slate-300">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-yellow-950/40">
          {companyMetrics.map((metric) => (
            <tr
              key={metric.name}
              className={`transition ${
                metric.name === activeCompany
                  ? 'border-l-4 border-l-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/15'
                  : 'hover:bg-white/5'
              }`}
            >
              <td className={`px-6 py-4 font-semibold ${metric.name === activeCompany ? 'text-yellow-400' : 'text-white'}`}>
                {metric.name}
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{metric.production}</span>
                    <span className="text-xs text-slate-500">{Math.round((metric.production / maxProduction) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.name === activeCompany ? 'bg-yellow-400' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((metric.production / maxProduction) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-emerald-300">{formatCurrency(metric.faturamento)}</td>
              <td className="px-6 py-4 text-red-300">{formatCurrency(metric.despesas)}</td>
              <td className={`px-6 py-4 font-semibold ${metric.saldo >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {formatCurrency(metric.saldo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
