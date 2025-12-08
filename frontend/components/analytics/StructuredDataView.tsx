// Professional structured data view component for analytics data

'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import DataTable, { Column } from '@/components/ui/DataTable'
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/format'

interface StructuredDataViewProps {
  title: string
  data: any[]
  type: 'revenue' | 'orders' | 'customers' | 'segments' | 'metrics'
  className?: string
  exportable?: boolean
}

export default function StructuredDataView({
  title,
  data,
  type,
  className = '',
  exportable = true,
}: StructuredDataViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'chart'>('table')

  const getColumns = (): Column<any>[] => {
    switch (type) {
      case 'revenue':
        return [
          {
            key: 'date',
            header: 'Date',
            format: 'date',
            sortable: true,
            width: '150px',
          },
          {
            key: 'value',
            header: 'Revenue',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'growth',
            header: 'Growth',
            format: 'percentage',
            sortable: true,
            align: 'right',
            render: (value) => (
              <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}>
                {formatPercentage(value)}
              </span>
            ),
          },
          {
            key: 'orders',
            header: 'Orders',
            format: 'number',
            sortable: true,
            align: 'right',
          },
          {
            key: 'avgOrderValue',
            header: 'Avg Order Value',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
        ]

      case 'orders':
        return [
          {
            key: 'date',
            header: 'Date',
            format: 'date',
            sortable: true,
            width: '150px',
          },
          {
            key: 'count',
            header: 'Total Orders',
            format: 'number',
            sortable: true,
            align: 'right',
          },
          {
            key: 'revenue',
            header: 'Revenue',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'avgValue',
            header: 'Average Value',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'growth',
            header: 'Growth',
            format: 'percentage',
            sortable: true,
            align: 'right',
            render: (value) => (
              <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}>
                {formatPercentage(value)}
              </span>
            ),
          },
        ]

      case 'customers':
        return [
          {
            key: 'segment',
            header: 'Segment',
            sortable: true,
          },
          {
            key: 'count',
            header: 'Count',
            format: 'number',
            sortable: true,
            align: 'right',
          },
          {
            key: 'revenue',
            header: 'Total Revenue',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'avgLTV',
            header: 'Avg LTV',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'churnRisk',
            header: 'Churn Risk',
            format: 'percentage',
            sortable: true,
            align: 'right',
            render: (value) => (
              <span className={value > 70 ? 'text-red-600 font-semibold' : value > 50 ? 'text-yellow-600' : 'text-green-600'}>
                {formatPercentage(value)}
              </span>
            ),
          },
        ]

      case 'segments':
        return [
          {
            key: 'name',
            header: 'Segment Name',
            sortable: true,
          },
          {
            key: 'count',
            header: 'Customer Count',
            format: 'number',
            sortable: true,
            align: 'right',
          },
          {
            key: 'revenue',
            header: 'Revenue',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'avgOrderValue',
            header: 'Avg Order Value',
            format: 'currency',
            sortable: true,
            align: 'right',
          },
          {
            key: 'growth',
            header: 'Growth',
            format: 'percentage',
            sortable: true,
            align: 'right',
            render: (value) => (
              <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}>
                {formatPercentage(value)}
              </span>
            ),
          },
        ]

      default:
        return [
          {
            key: 'metric',
            header: 'Metric',
            sortable: true,
          },
          {
            key: 'value',
            header: 'Value',
            sortable: true,
            align: 'right',
          },
          {
            key: 'change',
            header: 'Change',
            format: 'percentage',
            sortable: true,
            align: 'right',
          },
        ]
    }
  }

  const handleExport = () => {
    const csv = [
      getColumns().map((col) => col.header).join(','),
      ...data.map((row) =>
        getColumns()
          .map((col) => {
            const value = row[col.key as string]
            if (col.format === 'currency') return formatCurrency(value).replace(/,/g, '')
            if (col.format === 'percentage') return formatPercentage(value)
            if (col.format === 'date') return formatDate(value)
            return String(value || '')
          })
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSummaryStats = () => {
    if (!data || data.length === 0) return null

    const stats: Record<string, any> = {}

    if (type === 'revenue' || type === 'orders') {
      const values = data.map((d) => d.value || d.revenue || d.count || 0)
      stats.total = values.reduce((sum, v) => sum + v, 0)
      stats.average = stats.total / values.length
      stats.min = Math.min(...values)
      stats.max = Math.max(...values)

      if (data.length > 1) {
        const first = values[0]
        const last = values[values.length - 1]
        stats.growth = first > 0 ? ((last - first) / first) * 100 : 0
      }
    }

    return stats
  }

  const summary = getSummaryStats()

  return (
    <Card className={className} padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {summary && (
            <p className="text-sm text-gray-600 mt-1">
              {data.length} {data.length === 1 ? 'record' : 'records'}
              {summary.total && type !== 'customers' && (
                <>
                  {' '}
                  • Total: {type === 'revenue' || type === 'orders' ? formatCurrency(summary.total) : formatNumber(summary.total)}
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {exportable && (
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {data && data.length > 0 ? (
        <DataTable
          data={data}
          columns={getColumns()}
          keyExtractor={(row) => row.id || row.date || String(Math.random())}
          searchable={true}
          pagination={true}
          pageSize={10}
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No data available</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
          {summary.total !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {type === 'revenue' ? formatCurrency(summary.total) : formatNumber(summary.total)}
              </p>
            </div>
          )}
          {summary.average !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-lg font-semibold text-gray-900">
                {type === 'revenue' ? formatCurrency(summary.average) : formatNumber(Math.round(summary.average))}
              </p>
            </div>
          )}
          {summary.growth !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p
                className={`text-lg font-semibold ${
                  summary.growth > 0 ? 'text-green-600' : summary.growth < 0 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {formatPercentage(summary.growth)}
              </p>
            </div>
          )}
          {summary.max !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Peak</p>
              <p className="text-lg font-semibold text-gray-900">
                {type === 'revenue' ? formatCurrency(summary.max) : formatNumber(summary.max)}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

