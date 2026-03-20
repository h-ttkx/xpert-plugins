/**
 * 情绪评分工具
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { SentimentClient } from '../sentiment-client.js'

const SentimentScoreSchema = z.object({
  code: z.string().describe('Stock code (e.g., 600519, 00700)')
})

const client = new SentimentClient()

export function buildSentimentScoreTool() {
  return new DynamicStructuredTool({
    name: 'stock_sentiment_score',
    description: 'Get real-time sentiment score for a stock, including score value, sentiment level, and confidence',
    schema: SentimentScoreSchema,
    func: async ({ code }) => {
      try {
        const score = await client.fetchSentimentScore(code)
        return JSON.stringify({ code, ...score }, null, 2)
      } catch (error) {
        throw new Error(`Failed to get sentiment score for ${code}: ${error}`)
      }
    }
  })
}
