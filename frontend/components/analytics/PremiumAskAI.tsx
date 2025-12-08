// Premium Ask AI component with smooth animations

'use client'

import { useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import axios from 'axios'
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/format'

interface DateRange {
  startDate: string
  endDate: string
}

interface PremiumAskAIProps {
  brandId: string
  dateRange: DateRange
}

interface Message {
  type: 'user' | 'assistant'
  content: string
  sources?: Array<{
    metric: string
    value: number
    period: string
    description?: string
  }>
  confidence?: number
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  'What caused the revenue drop last week?',
  'Which segment is performing best?',
  'How did orders change compared to last month?',
  "What's the average order value trend?",
  'Which channel drives the most revenue?',
]

export default function PremiumAskAI({ brandId, dateRange }: PremiumAskAIProps) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const askQuestion = async (q: string) => {
    if (!q.trim()) return

    const userMessage: Message = {
      type: 'user',
      content: q,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('brand_token')

      const response = await axios.post(
        `${apiUrl}/api/analytics/ask`,
        {
          question: q,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'x-brand-id': brandId,
          },
        }
      )

      if (response.data.success && response.data.data) {
        const assistantMessage: Message = {
          type: 'assistant',
          content: response.data.data.answer,
          sources: response.data.data.sources,
          confidence: response.data.data.confidence,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        setError('Failed to get answer')
      }
    } catch (err: any) {
      console.error('Error asking question:', err)
      setError(err.response?.data?.error || 'Failed to get answer')
      
      const errorMessage: Message = {
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    askQuestion(question)
  }

  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q)
    askQuestion(q)
  }

  return (
    <Card padding="lg" className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Ask AI</h3>
          <p className="text-sm text-gray-600">Get instant insights about your data</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">LLM Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">Ask a question to get started</p>
            
            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 mb-3">💡 Suggested questions:</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_QUESTIONS.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg text-sm text-gray-700 transition-all hover:shadow-md hover:scale-[1.02]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300 space-y-1">
                    <p className="text-xs font-semibold mb-2">📊 Data Sources:</p>
                    {message.sources.map((source, i) => (
                      <div key={i} className="text-xs bg-white/50 rounded px-2 py-1">
                        <span className="font-medium">{source.metric}:</span>{' '}
                        <span className="font-semibold">
                          {source.metric.toLowerCase().includes('revenue') || 
                           source.metric.toLowerCase().includes('ltv') || 
                           source.metric.toLowerCase().includes('value')
                            ? formatCurrency(source.value)
                            : source.metric.toLowerCase().includes('growth') || 
                              source.metric.toLowerCase().includes('churn') || 
                              source.metric.toLowerCase().includes('risk')
                            ? formatPercentage(source.value)
                            : formatNumber(source.value)}
                        </span>
                        {source.period && <span className="text-gray-500"> ({source.period})</span>}
                      </div>
                    ))}
                  </div>
                )}

                {message.confidence !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Confidence:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${message.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold">
                        {(message.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your analytics..."
          disabled={loading}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
        />
        <Button type="submit" disabled={loading || !question.trim()} size="lg">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Ask
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </Card>
  )
}

