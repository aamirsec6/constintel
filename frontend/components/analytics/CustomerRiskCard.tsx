// Customer risk section with progress indicators

'use client'

import { AlertCircle, Users } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'
import { formatNumber } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

interface CustomerRiskCardProps {
  atRiskCount?: number
  totalCustomers?: number
  riskPercentage?: number
  loading?: boolean
  onViewDetails?: () => void
}

export default function CustomerRiskCard({
  atRiskCount = 0,
  totalCustomers = 0,
  riskPercentage = 0,
  loading = false,
  onViewDetails,
}: CustomerRiskCardProps) {
  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  const riskLevel = riskPercentage > 70 ? 'high' : riskPercentage > 50 ? 'medium' : 'low'
  const riskColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200',
  }

  return (
    <Card padding="lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Customer Risk</h3>
          <p className="text-sm text-gray-600">Churn score analysis</p>
        </div>
      </div>

      {totalCustomers === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No customer data available</p>
          <p className="text-xs text-gray-400">Customer risk analysis will appear here</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900">
                {formatNumber(atRiskCount)}
              </span>
              <span className="text-lg text-gray-600">
                / {formatNumber(totalCustomers)} customers
              </span>
            </div>
            <Progress
              value={riskPercentage}
              max={100}
              showLabel
              className="mb-2"
            />
            <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-lg border', riskColors[riskLevel])}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {riskLevel.toUpperCase()} RISK ({formatNumber(riskPercentage)}%)
              </span>
            </div>
          </div>

          <Button
            onClick={onViewDetails}
            variant="outline"
            className="w-full"
          >
            View At-Risk Customers
          </Button>
        </>
      )}
    </Card>
  )
}

import { cn } from '@/lib/utils/cn'

