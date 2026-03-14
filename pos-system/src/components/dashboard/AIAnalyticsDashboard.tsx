'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AIAnalysis {
  deadStock: {
    name: string
    quantity: number
    recommendation: string
  }[]
  profitForecast: {
    trend: 'UP' | 'DOWN' | 'NEUTRAL'
    analysis: string
  }
}

export function AIAnalyticsDashboard() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analyze', { method: 'POST' })
      if (!res.ok) {
        throw new Error('Failed to fetch AI analysis')
      }
      const data = await res.json()
      setAnalysis(data)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'AI Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  if (loading) {
    return (
      <Card className="col-span-full xl:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <CardContent className="h-64 flex flex-col items-center justify-center gap-4 relative z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">AI Consultant is analyzing your business...</p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="col-span-full xl:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="h-64 flex flex-col items-center justify-center gap-4">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground text-center max-w-sm">No analysis available. Click below to generate fresh insights.</p>
          <Button variant="outline" onClick={fetchAnalysis}>Generate Analysis</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full xl:col-span-2 border-primary/30 shadow-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Business Consultant
            </CardTitle>
            <CardDescription>Strategic insights based on your last 30 days of activity.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAnalysis} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profit Forecast */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
            Profit Forecast
          </h3>
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full flex items-center justify-center
                ${analysis.profitForecast.trend === 'UP' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  analysis.profitForecast.trend === 'DOWN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }
              `}>
                {analysis.profitForecast.trend === 'UP' && <TrendingUp className="h-6 w-6" />}
                {analysis.profitForecast.trend === 'DOWN' && <TrendingDown className="h-6 w-6" />}
                {analysis.profitForecast.trend === 'NEUTRAL' && <Minus className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {analysis.profitForecast.trend === 'UP' ? 'Growing' : analysis.profitForecast.trend === 'DOWN' ? 'Declining' : 'Stable'}
                </p>
                <p className="text-sm text-muted-foreground">Predicted 30-Day Trend</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">
              {analysis.profitForecast.analysis}
            </p>
          </div>
        </div>

        {/* Dead Stock Analysis */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            Dead Stock Alerts
          </h3>
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            {analysis.deadStock.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">
                No dead stock detected. Inventory is moving well!
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">Item</th>
                      <th className="py-2 px-4 text-center font-medium text-muted-foreground">Qty</th>
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">AI Advice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.deadStock.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="destructive" className="font-mono">{item.quantity}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs leading-tight">
                          {item.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
