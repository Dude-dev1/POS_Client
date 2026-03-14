import { createAdminClient } from '@/lib/supabase/admin'
import { getGeminiModel } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()

    console.log('AI Analyze: Fetching required context...')
    
    // 1. Fetch Dead Stock Candidates (last updated > 30 days or never sold)
    // We'll fetch all products and recent sale_items to see what hasn't moved
    const { data: allProducts } = await supabase.from('products').select('id, name, quantity, price')
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentSaleItems } = await supabase
      .from('sale_items')
      .select('product_id')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const recentSoldProductIds = new Set((recentSaleItems || []).map(si => si.product_id))
    
    const deadStockCandidates = (allProducts || [])
      .filter(p => p.quantity > 0 && !recentSoldProductIds.has(p.id))
      .slice(0, 20) // Limit to top 20 to save tokens

    // 2. Fetch Recent Sales and Expenses for Profit Forecast
    const { data: recentSales } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      
    const { data: recentExpenses } = await supabase
      .from('expenses')
      .select('amount, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      
    const totalRevenue = (recentSales || []).reduce((sum, s) => sum + s.total_amount, 0)
    const totalExpenses = (recentExpenses || []).reduce((sum, e) => sum + e.amount, 0)

    const context = `
[Business Context]
Current Date: ${new Date().toISOString()}
Last 30 Days Revenue: GHS ${totalRevenue}
Last 30 Days Expenses: GHS ${totalExpenses}
Products with Zero Movement in 30 Days (Top 20): ${JSON.stringify(deadStockCandidates)}
`

    const prompt = `
You are an expert AI Business Consultant for a Point of Sale system. 
Analyze the provided business context and return a STRICT JSON object in the exact format shown below.
Do not include markdown codeblocks (\`\`\`json) in your response, just the raw JSON.

Format:
{
  "deadStock": [
    {
      "name": "Product Name",
      "quantity": 10,
      "recommendation": "Brief actionable advice (e.g. 'Discount by 20%')"
    }
  ],
  "profitForecast": {
    "trend": "UP", // UP, DOWN, or NEUTRAL
    "analysis": "A concise 2-sentence summary of the financial health and prediction for the next month based on the revenue/expense ratio."
  }
}

Context:
${context}
`
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean potential markdown blocks
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json/, '')
      text = text.replace(/\`\`\`$/, '')
      text = text.trim()
    }

    const jsonAnalysis = JSON.parse(text)
    
    return NextResponse.json(jsonAnalysis)
  } catch (error: any) {
    console.error('AI Analysis Route Fatal Error:', error)
    return NextResponse.json({ 
      error: error.message || 'AI failed to analyze data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 })
  }
}
