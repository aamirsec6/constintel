// GENERATOR: ANALYTICS_DASHBOARD
// Funnel visualization component
// HOW TO USE: <FunnelChart stages={funnelData.stages} />

'use client'

interface FunnelStage {
  stage: string
  label: string
  count: number
  conversionRate: number
  dropOffRate: number
}

interface FunnelChartProps {
  stages: FunnelStage[]
  height?: number
}

export default function FunnelChart({ stages, height = 400 }: FunnelChartProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex flex-col items-center gap-2 h-full justify-center">
        {stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100
          const isLast = index === stages.length - 1

          return (
            <div key={index} className="w-full flex flex-col items-center">
              <div
                className="bg-blue-500 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:bg-blue-600"
                style={{ width: `${Math.max(widthPercent, 10)}%` }}
              >
                <div className="text-sm font-semibold">{stage.label}</div>
                <div className="text-xs opacity-90">
                  {stage.count.toLocaleString()} ({stage.conversionRate.toFixed(1)}%)
                </div>
              </div>
              
              {!isLast && (
                <div className="flex flex-col items-center my-1">
                  <div className="text-xs text-gray-500">
                    ↓ Drop-off: {stage.dropOffRate.toFixed(1)}%
                  </div>
                  <div className="w-0.5 h-4 bg-gray-300"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

