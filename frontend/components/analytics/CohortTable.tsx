// GENERATOR: ANALYTICS_DASHBOARD
// Cohort retention table visualization component
// HOW TO USE: <CohortTable cohorts={cohortData} />

'use client'

interface CohortData {
  cohortPeriod: string
  cohortSize: number
  metrics: {
    retention: {
      d1?: number
      d7?: number
      d30?: number
      d90?: number
    }
    revenue: {
      total: number
    }
  }
}

interface CohortTableProps {
  cohorts: CohortData[]
}

export default function CohortTable({ cohorts }: CohortTableProps) {
  const getRetentionColor = (value?: number) => {
    if (!value) return 'bg-gray-100'
    if (value >= 50) return 'bg-green-100'
    if (value >= 30) return 'bg-yellow-100'
    if (value >= 10) return 'bg-orange-100'
    return 'bg-red-100'
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cohort
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              D1 Retention
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              D7 Retention
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              D30 Retention
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              D90 Retention
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cohorts.map((cohort, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {cohort.cohortPeriod}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cohort.cohortSize.toLocaleString()}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getRetentionColor(cohort.metrics.retention.d1)}`}>
                {cohort.metrics.retention.d1?.toFixed(1) || '-'}%
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getRetentionColor(cohort.metrics.retention.d7)}`}>
                {cohort.metrics.retention.d7?.toFixed(1) || '-'}%
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getRetentionColor(cohort.metrics.retention.d30)}`}>
                {cohort.metrics.retention.d30?.toFixed(1) || '-'}%
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getRetentionColor(cohort.metrics.retention.d90)}`}>
                {cohort.metrics.retention.d90?.toFixed(1) || '-'}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${cohort.metrics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

