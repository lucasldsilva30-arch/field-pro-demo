"use client"

import { useMemo } from 'react'
import { calculateVariation, formatVariation, type IndicatorType, type DrilldownData, type DrilldownRecord } from '@/lib/indicators'

interface DrilldownIndicatorProps {
  label: string
  value: string
  helper: string
  monthPrevious?: number
  current?: number
  type: IndicatorType
  records?: DrilldownRecord[]
  onDrilldown: (data: DrilldownData) => void
}

export function DrilldownIndicator({
  label,
  value,
  helper,
  monthPrevious,
  current,
  type,
  records = [],
  onDrilldown,
}: DrilldownIndicatorProps) {
  const variation = useMemo(() => calculateVariation(current ?? 0, monthPrevious), [current, monthPrevious])

  return (
    <button
      onClick={() => onDrilldown({ type, records, total: current ?? 0, monthPrevious })}
      className="rounded-2xl border border-yellow-950/60 bg-zinc-950 p-4 text-left transition hover:border-yellow-500/40 hover:bg-zinc-900"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-3 block text-xl tracking-tight text-white">{value}</strong>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">{helper}</p>
        {variation.direction !== 'neutral' && (
          <span className={`text-xs font-bold ${variation.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatVariation(variation)}
          </span>
        )}
      </div>
    </button>
  )
}
