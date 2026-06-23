'use client'

import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import type { ProductionRecord } from '@/lib/indicators'

interface StatusOperationalChartProps {
  records: ProductionRecord[]
  onFilterStatus: (status: string | null) => void
  selectedStatus: string | null
}

export function StatusOperationalChart({ records, onFilterStatus, selectedStatus }: StatusOperationalChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')

  const statusData = useMemo(() => {
    const statusMap = new Map<string, number>()

    records.forEach((record) => {
      const status = record.status || 'Não definido'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    return Array.from(statusMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [records])

  const colors = ['#fbbf24', '#34d399', '#f87171', '#60a5fa']

  const handleStatusClick = (status: string) => {
    onFilterStatus(selectedStatus === status ? null : status)
  }

  function extractName(obj: unknown) {
    if (!obj || typeof obj !== 'object') return ''
    const o = obj as Record<string, unknown>
    return typeof o.name === 'string' ? o.name : String(o.name ?? '')
  }

  return (
    <section className="rounded-2xl border border-yellow-950/60 bg-zinc-950 p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Status Operacional</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('pie')}
            data-demo-nav="true"
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              chartType === 'pie'
                ? 'bg-yellow-500 text-black'
                : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            Donut
          </button>
          <button
            onClick={() => setChartType('bar')}
            data-demo-nav="true"
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              chartType === 'bar'
                ? 'bg-yellow-500 text-black'
                : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            Barras
          </button>
        </div>
      </div>

      {statusData.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-black px-4 py-6 text-center text-sm text-slate-500">
          Nenhum dado de status disponível.
        </p>
      ) : (
        <>
          <div className="h-[320px] w-full">
            <ResponsiveContainer height={320} width="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(entry: unknown) => handleStatusClick(extractName(entry) || "")}
                    style={{ cursor: "pointer" }}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                        opacity={selectedStatus === null || selectedStatus === statusData[index]?.name ? 1 : 0.4}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #78350f',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                </PieChart>
              ) : (
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #78350f',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#fbbf24"
                    radius={[8, 8, 0, 0]}
                    onClick={(data: unknown) => handleStatusClick(extractName(data) || "")}
                    style={{ cursor: "pointer" }}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statusData.map((status) => (
              <button
                key={status.name}
                onClick={() => handleStatusClick(status.name)}
                data-demo-nav="true"
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  selectedStatus === status.name
                    ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300'
                    : 'border-white/10 bg-black text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="block text-xs text-slate-500">{status.name}</span>
                <span className="mt-1 block text-lg text-white">{status.value}</span>
              </button>
            ))}
          </div>

          {selectedStatus && (
            <button
              onClick={() => onFilterStatus(null)}
              data-demo-nav="true"
              className="mt-4 w-full rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
            >
              Limpar filtro
            </button>
          )}
        </>
      )}
    </section>
  )
}
