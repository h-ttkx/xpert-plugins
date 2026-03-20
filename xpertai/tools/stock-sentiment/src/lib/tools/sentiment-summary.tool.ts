/**
 * 情绪摘要工具
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { SentimentClient } from '../sentiment-client.js'

const SentimentSummarySchema = z.object({
  code: z.string().describe('Stock code (e.g., 600519, 00700)')
})

const client = new SentimentClient()

export function buildSentimentSummaryTool() {
  return new DynamicStructuredTool({
    name: 'stock_sentiment_summary',
    description: 'Get comprehensive sentiment analysis summary for a stock, including overall score, key factors, and risk warnings',
    schema: SentimentSummarySchema,
    func: async ({ code }) => {
      try {
        const summary = await client.fetchSentimentSummary(code)
        return JSON.stringify(summary, null, 2)
      } catch (error) {
        throw new Error(`Failed to get sentiment summary for ${code}: ${error}`)
      }
    }
  })
}
