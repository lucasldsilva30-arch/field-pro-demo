// utilities for indicators

export type IndicatorType = 'producaodia' | 'faturamento' | 'apagar' | 'vr'

export interface DrilldownRecord {
  id: string
  date?: string
  equipe?: string
  points?: number
  value?: number
  status?: string
  launchedConecta?: boolean
  description?: string
  category?: string
  amount?: number
  paid?: boolean
  funcionario?: string
  diasTrabalhados?: number
  sabados?: number
}

export type ProductionRecord = DrilldownRecord;

export interface DrilldownData {
  type: IndicatorType
  records: DrilldownRecord[]
  total: number
  monthPrevious?: number
}

export function calculateVariation(current: number, previous?: number): { percentage: number; direction: 'up' | 'down' | 'neutral' } {
  if (!previous || previous === 0) return { percentage: 0, direction: 'neutral' }
  const variation = ((current - previous) / previous) * 100
  return {
    percentage: Math.abs(variation),
    direction: variation > 0 ? 'up' : variation < 0 ? 'down' : 'neutral',
  }
}

export function formatVariation(data: ReturnType<typeof calculateVariation>): string {
  if (data.direction === 'neutral') return '—'
  const arrow = data.direction === 'up' ? '↑' : '↓'
  return `${arrow} ${data.percentage.toFixed(1)}%`
}

export function getStatusCount(records: DrilldownRecord[], status: string): number {
  return records.filter((r) => r.status === status).length
}

export function filterProductionByStatus(records: DrilldownRecord[], status: string): DrilldownRecord[] {
  return records.filter((r) => r.status === status)
}
