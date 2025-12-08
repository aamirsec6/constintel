// GENERATOR: SIRI_LIKE_LLM
// Conversational natural language query interface (Ask AI)
// HOW TO USE: <AskAI brandId={brandId} dateRange={dateRange} />

'use client'

import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import axios from 'axios'
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/format'
import { Loader2, Sparkles, RotateCcw } from 'lucide-react'

interface QuerySource {
  metric: string
  value: number
  period: string
  description?: string
}

interface QueryResult {
  answer: string
  sources: QuerySource[]
  confidence: number
  followUpQuestions?: string[]
  proactiveInsights?: string[]
  conversationSummary?: string
  sessionId?: string
}

interface DateRange {
  startDate: string
  endDate: string
}

interface AskAIProps {
  brandId: string
  dateRange: DateRange
  className?: string
}

interface Message {
  type: 'user' | 'assistant'
  content: string
  sources?: QuerySource[]
  confidence?: number
  timestamp: Date
  followUpQuestions?: string[]
  proactiveInsights?: string[]
}

const SUGGESTED_QUESTIONS = [
  "What caused the revenue drop last week?",
  "Which segment is performing best?",
  "How did orders change compared to last month?",
  "What's the average order value trend?",
  "Which channel drives the most revenue?",
]

export default function AskAI({ brandId, dateRange, className = '' }: AskAIProps) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [proactiveInsights, setProactiveInsights] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  // Initialize session on mount
  useEffect(() => {
    // Try to restore session from localStorage
    const storedSessionId = localStorage.getItem(`askai_session_${brandId}`)
    const storedMessages = localStorage.getItem(`askai_messages_${brandId}`)
    
    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
    
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages)
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })))
      } catch (e) {
        console.warn('Failed to restore messages from localStorage:', e)
      }
    }
  }, [brandId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`askai_messages_${brandId}`, JSON.stringify(messages))
    }
  }, [messages, brandId])

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
      // Use the same token key as the dashboard
      const token = localStorage.getItem('accessToken') || 
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('brand_token') ||
                    localStorage.getItem('token')

      if (!token) {
        setError('Please log in to use Ask AI. Token not found.')
        setLoading(false)
        return
      }

      if (!brandId) {
        setError('Brand ID is required. Please refresh the page.')
        setLoading(false)
        return
      }

      const response = await axios.post(
        `${apiUrl}/api/analytics/ask`,
        {
          question: q,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          sessionId: sessionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-brand-id': brandId,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success && response.data.data) {
        const data = response.data.data
        
        // Update session ID if provided
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId)
          localStorage.setItem(`askai_session_${brandId}`, data.sessionId)
        }

        const assistantMessage: Message = {
          type: 'assistant',
          content: data.answer,
          sources: data.sources,
          confidence: data.confidence,
          followUpQuestions: data.followUpQuestions,
          proactiveInsights: data.proactiveInsights,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Store proactive insights if this is the first message
        if (data.proactiveInsights && data.proactiveInsights.length > 0 && messages.length === 0) {
          setProactiveInsights(data.proactiveInsights)
        }
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

  const startNewConversation = () => {
    setMessages([])
    setSessionId(null)
    setProactiveInsights([])
    localStorage.removeItem(`askai_session_${brandId}`)
    localStorage.removeItem(`askai_messages_${brandId}`)
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
    <Card className={`${className} shadow-lg border-0 bg-white`}>
      <div className="p-6 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Ask AI
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {messages.length > 0 
                  ? '✨ Conversational AI - I remember our conversation'
                  : 'Ask questions about your analytics data in plain English'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <Button
                onClick={startNewConversation}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                New Chat
              </Button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-green-700">LLM Active</span>
            </div>
          </div>
        </div>

        {/* Proactive Insights Panel */}
        {proactiveInsights.length > 0 && messages.length === 0 && (
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200/50 rounded-xl shadow-sm">
            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Proactive Insights
            </p>
            <ul className="space-y-2">
              {proactiveInsights.map((insight, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✨</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto px-1 py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Start a conversation to get insights</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white'
                      : 'bg-white text-gray-900 border-2 border-gray-100 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                  
                  {/* Follow-up Questions */}
                  {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className={`mt-4 pt-4 ${message.type === 'user' ? 'border-t border-white/20' : 'border-t border-gray-200'}`}>
                      <p className={`text-xs font-bold mb-3 ${message.type === 'user' ? 'text-white/90' : 'text-gray-700'}`}>
                        💡 You might also ask:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.followUpQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => askQuestion(q)}
                            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 ${
                              message.type === 'user'
                                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                                : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 text-blue-700 shadow-sm'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proactive Insights in Message */}
                  {message.proactiveInsights && message.proactiveInsights.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs font-semibold mb-2 text-gray-700">✨ Insight:</p>
                      <ul className="space-y-1">
                        {message.proactiveInsights.map((insight, i) => (
                          <li key={i} className="text-xs text-gray-600">• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className={`mt-4 pt-4 ${message.type === 'user' ? 'border-t border-white/20' : 'border-t border-gray-200'}`}>
                      <p className={`text-xs font-bold mb-3 ${message.type === 'user' ? 'text-white/90' : 'text-gray-700'}`}>
                        📊 Data Sources:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, i) => (
                          <div key={i} className={`text-xs rounded-lg px-3 py-2 ${
                            message.type === 'user' 
                              ? 'bg-white/15 backdrop-blur-sm' 
                              : 'bg-gradient-to-r from-gray-50 to-blue-50/50 border border-gray-100'
                          }`}>
                            <span className={`font-semibold ${message.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                              {source.metric}:
                            </span>{' '}
                            <span className={`font-bold ${
                              message.type === 'user' ? 'text-white' : 'text-blue-700'
                            }`}>
                              {source.metric.toLowerCase().includes('revenue') || source.metric.toLowerCase().includes('ltv') || source.metric.toLowerCase().includes('value')
                                ? formatCurrency(source.value)
                                : source.metric.toLowerCase().includes('growth') || source.metric.toLowerCase().includes('churn') || source.metric.toLowerCase().includes('risk')
                                ? formatPercentage(source.value)
                                : formatNumber(source.value)}
                            </span>
                            {source.period && (
                              <span className={message.type === 'user' ? 'text-white/80' : 'text-gray-500'}>
                                {' '}({source.period})
                              </span>
                            )}
                            {source.description && (
                              <span className={`block mt-1 ${message.type === 'user' ? 'text-white/80' : 'text-gray-600'}`}>
                                {source.description}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.confidence !== undefined && (
                    <div className={`mt-4 pt-4 ${message.type === 'user' ? 'border-t border-white/20' : 'border-t border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${message.type === 'user' ? 'text-white/90' : 'text-gray-600'}`}>
                          Confidence:
                        </span>
                        <div className={`flex-1 rounded-full h-2.5 overflow-hidden ${
                          message.type === 'user' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              message.confidence > 0.8 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : message.confidence > 0.6
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            }`}
                            style={{ width: `${message.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold min-w-[40px] ${
                          message.type === 'user' ? 'text-white' : 'text-gray-700'
                        }`}>
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
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border-2 border-blue-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div className="absolute inset-0 w-5 h-5 border-2 border-blue-200 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Analyzing your question...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Suggested questions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTED_QUESTIONS.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="group text-left px-5 py-4 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 hover:from-blue-100 hover:via-purple-100 hover:to-indigo-100 border-2 border-blue-200/50 hover:border-blue-300 rounded-xl text-sm font-medium text-gray-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-blue-600 group-hover:text-purple-600 transition-colors">💬</span>
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={messages.length > 0 ? "Ask a follow-up question..." : "Ask a question about your data..."}
              disabled={loading}
              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-sm hover:border-gray-400"
            />
            {question && (
              <button
                type="button"
                onClick={() => setQuestion('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={loading || !question.trim()} 
            size="lg"
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Ask
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

