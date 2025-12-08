// GENERATOR: OLLAMA_INTEGRATION
// Report generation component
// HOW TO USE: <ReportGenerator brandId={brandId} dateRange={dateRange} />

'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import axios from 'axios'

interface DateRange {
  startDate: string
  endDate: string
}

interface ReportGeneratorProps {
  brandId: string
  dateRange: DateRange
  className?: string
}

const REPORT_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary' },
  { id: 'metrics', label: 'Key Metrics' },
  { id: 'insights', label: 'Key Insights' },
  { id: 'recommendations', label: 'Recommendations' },
]

const REPORT_FORMATS = [
  { id: 'text', label: 'Plain Text' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'pdf', label: 'PDF (Coming Soon)' },
]

export default function ReportGenerator({
  brandId,
  dateRange,
  className = '',
}: ReportGeneratorProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    REPORT_SECTIONS.map((s) => s.id)
  )
  const [selectedFormat, setSelectedFormat] = useState<string>('markdown')
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const generateReport = async () => {
    if (selectedSections.length === 0) {
      setError('Please select at least one section')
      return
    }

    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('brand_token')

      const response = await axios.post(
        `${apiUrl}/api/analytics/reports/generate`,
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          format: selectedFormat,
          sections: selectedSections,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'x-brand-id': brandId,
          },
        }
      )

      if (response.data.success && response.data.data?.report) {
        setReport(response.data.data.report)
      } else {
        setError('Failed to generate report')
      }
    } catch (err: any) {
      console.error('Error generating report:', err)
      setError(err.response?.data?.error || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const downloadReport = () => {
    if (!report) return

    let content = report
    let mimeType = 'text/plain'
    let extension = 'txt'

    if (selectedFormat === 'markdown') {
      mimeType = 'text/markdown'
      extension = 'md'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${dateRange.startDate}-${dateRange.endDate}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (!report) return
    navigator.clipboard.writeText(report)
    alert('Report copied to clipboard!')
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Report</h2>

        {!report ? (
          <>
            {/* Section Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sections:
              </label>
              <div className="space-y-2">
                {REPORT_SECTIONS.map((section) => (
                  <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{section.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format:
              </label>
              <div className="flex gap-4">
                {REPORT_SECTIONS.filter((f) => f.id !== 'pdf' || true).map((format) => (
                  <label key={format.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{format.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={generateReport} disabled={loading} className="w-full">
              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>

            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
          </>
        ) : (
          <>
            {/* Report Preview */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Report Preview</h3>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} size="sm" variant="outline">
                    Copy
                  </Button>
                  <Button onClick={downloadReport} size="sm">
                    Download
                  </Button>
                  <Button
                    onClick={() => setReport(null)}
                    size="sm"
                    variant="secondary"
                  >
                    Generate New
                  </Button>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                {selectedFormat === 'markdown' ? (
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                    {report}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{report}</pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

