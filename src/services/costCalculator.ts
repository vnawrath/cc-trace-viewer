/**
 * Cost Calculator Service
 *
 * Calculates costs for Claude API requests based on token usage and model pricing.
 *
 * Pricing Sources:
 * - Claude 4.5 models: https://www.anthropic.com/pricing (December 2025)
 * - Claude 4 models: https://www.anthropic.com/pricing (December 2025)
 * - Claude 3 models: https://www.anthropic.com/pricing (December 2025)
 *
 * Last Updated: December 2025
 *
 * Cost Calculation Formula:
 * Total Cost = (input_tokens × input_price)
 *            + (output_tokens × output_price)
 *            + (cache_5m_tokens × cache_5m_price)
 *            + (cache_1h_tokens × cache_1h_price)
 *            + (cache_read_tokens × cache_read_price)
 *
 * Where:
 * - cache_5m_price = input_price × 1.25 (5-minute cache write)
 * - cache_1h_price = input_price × 2.0 (1-hour cache write)
 * - cache_read_price = input_price × 0.1 (90% cache read savings)
 * - All prices are per 1 million tokens (MTok)
 */

import type { TokenUsage } from '../types/trace';

/**
 * Pricing structure for a Claude model
 */
export interface ModelPricing {
  /** Price per million input tokens ($/MTok) */
  input: number;
  /** Price per million output tokens ($/MTok) */
  output: number;
  /** Price per million cache write tokens (5-minute ephemeral) - calculated as input × 1.25 */
  cacheWrite5m: number;
  /** Price per million cache write tokens (1-hour ephemeral) - calculated as input × 2.0 */
  cacheWrite1h: number;
  /** Price per million cache read tokens - calculated as input × 0.1 (90% savings) */
  cacheRead: number;
  /** Optional: Price per million input tokens for long-context requests (>200K tokens) */
  inputLongContext?: number;
  /** Optional: Price per million output tokens for long-context requests (>200K tokens) */
  outputLongContext?: number;
  /** Optional: Threshold in tokens for long-context pricing (e.g., 200000 for Sonnet 4.5) */
  longContextThreshold?: number;
}

/**
 * Complete pricing map for all Claude models
 *
 * Pricing is per million tokens (MTok). Cache pricing follows these rules:
 * - Cache Write (5-min): 1.25× input price
 * - Cache Write (1-hour): 2.0× input price
 * - Cache Read: 0.1× input price (90% savings)
 *
 * Special case: Sonnet 4.5 has premium pricing for requests >200K input tokens
 */
export const CLAUDE_PRICING: Record<string, ModelPricing> = {
  // Claude 4.5 Models (Latest generation)
  'claude-opus-4-5': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,   // 15 × 1.25
    cacheWrite1h: 30,      // 15 × 2.0
    cacheRead: 1.5,        // 15 × 0.1
  },
  'claude-opus-4-5-20250514': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheRead: 1.5,
  },
  'claude-sonnet-4-5': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,    // 3 × 1.25
    cacheWrite1h: 6,       // 3 × 2.0
    cacheRead: 0.3,        // 3 × 0.1
    // Long-context pricing (>200K input tokens)
    inputLongContext: 6,
    outputLongContext: 30,
    longContextThreshold: 200000,
  },
  'claude-sonnet-4-5-20250929': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
    inputLongContext: 6,
    outputLongContext: 30,
    longContextThreshold: 200000,
  },
  'claude-haiku-4-5': {
    input: 1,
    output: 5,
    cacheWrite5m: 1.25,    // 1 × 1.25
    cacheWrite1h: 2,       // 1 × 2.0
    cacheRead: 0.1,        // 1 × 0.1
  },
  'claude-haiku-4-5-20250514': {
    input: 1,
    output: 5,
    cacheWrite5m: 1.25,
    cacheWrite1h: 2,
    cacheRead: 0.1,
  },

  // Claude 4 Models (Legacy)
  'claude-opus-4': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheRead: 1.5,
  },
  'claude-opus-4-20241113': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheRead: 1.5,
  },
  'claude-sonnet-4': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },
  'claude-sonnet-4-20241022': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },

  // Claude 3 Models (Deprecated/Retiring)
  'claude-3-opus-20240229': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheRead: 1.5,
  },
  'claude-3-5-sonnet-20241022': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },
  'claude-3-5-sonnet-20240620': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },
  'claude-3-5-haiku-20241022': {
    input: 1,
    output: 5,
    cacheWrite5m: 1.25,
    cacheWrite1h: 2,
    cacheRead: 0.1,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
    cacheWrite5m: 0.3125,  // 0.25 × 1.25
    cacheWrite1h: 0.5,     // 0.25 × 2.0
    cacheRead: 0.025,      // 0.25 × 0.1
  },
  'claude-3-sonnet-20240229': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },
};

/**
 * Formats a cost value for display
 *
 * Rules:
 * - Costs < $0.01: Display 4 decimal places (e.g., "$0.0012")
 * - Costs >= $0.01: Display 2 decimal places (e.g., "$1.57")
 *
 * @param cost - The cost value in dollars
 * @returns Formatted cost string with $ prefix
 *
 * @example
 * formatCost(0.0012) // "$0.0012"
 * formatCost(1.5678) // "$1.57"
 * formatCost(0.01) // "$0.01"
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculates the cost of a Claude API request based on token usage and model
 *
 * @param model - The Claude model identifier (e.g., "claude-sonnet-4-5")
 * @param tokens - Token usage breakdown from the API response
 * @param totalInputTokens - Optional: Total input tokens including cache (for long-context detection)
 * @returns Cost in USD, or null if model pricing is unknown
 *
 * @example
 * const cost = calculateRequestCost(
 *   'claude-sonnet-4-5',
 *   {
 *     input_tokens: 1000,
 *     output_tokens: 500,
 *     cache_creation_input_tokens: 0,
 *     cache_read_input_tokens: 0,
 *     cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
 *     service_tier: 'default'
 *   }
 * );
 * // Returns: 0.0105 (calculated as: 1000/1M × $3 + 500/1M × $15)
 *
 * @example
 * // Long-context Sonnet 4.5 (>200K input tokens)
 * const cost = calculateRequestCost(
 *   'claude-sonnet-4-5',
 *   {
 *     input_tokens: 250000,
 *     output_tokens: 1000,
 *     cache_creation_input_tokens: 0,
 *     cache_read_input_tokens: 0,
 *     cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
 *     service_tier: 'default'
 *   },
 *   250000
 * );
 * // Returns: 1.53 (uses premium pricing: 250000/1M × $6 + 1000/1M × $30)
 */
export function calculateRequestCost(
  model: string,
  tokens: TokenUsage,
  totalInputTokens?: number
): number | null {
  // Look up pricing for the model
  const pricing = CLAUDE_PRICING[model];

  if (!pricing) {
    // Unknown model - return null
    return null;
  }

  // Determine if we should use long-context pricing
  const useLongContext = pricing.longContextThreshold
    && totalInputTokens !== undefined
    && totalInputTokens > pricing.longContextThreshold;

  // Select appropriate pricing tier
  const inputPrice = useLongContext && pricing.inputLongContext
    ? pricing.inputLongContext
    : pricing.input;
  const outputPrice = useLongContext && pricing.outputLongContext
    ? pricing.outputLongContext
    : pricing.output;

  // Calculate costs for each token type (prices are per million tokens)
  const inputCost = (tokens.input_tokens / 1_000_000) * inputPrice;
  const outputCost = (tokens.output_tokens / 1_000_000) * outputPrice;

  // Cache creation tokens (5-minute and 1-hour ephemeral)
  const cache5mCost = (tokens.cache_creation.ephemeral_5m_input_tokens / 1_000_000) * pricing.cacheWrite5m;
  const cache1hCost = (tokens.cache_creation.ephemeral_1h_input_tokens / 1_000_000) * pricing.cacheWrite1h;

  // Cache read tokens (90% savings)
  const cacheReadCost = (tokens.cache_read_input_tokens / 1_000_000) * pricing.cacheRead;

  // Sum all costs
  const totalCost = inputCost + outputCost + cache5mCost + cache1hCost + cacheReadCost;

  return totalCost;
}

/**
 * Extracts a readable model name from a full model identifier
 *
 * Converts model IDs like "claude-sonnet-4-5-20250929" to "Sonnet 4.5"
 *
 * @param model - The full model identifier
 * @returns A human-readable model name
 *
 * @example
 * getModelDisplayName('claude-sonnet-4-5-20250929') // "Sonnet 4.5"
 * getModelDisplayName('claude-opus-4') // "Opus 4"
 * getModelDisplayName('claude-3-haiku-20240307') // "3 Haiku"
 */
export function getModelDisplayName(model: string): string {
  // Remove "claude-" prefix
  let name = model.replace(/^claude-/, '');

  // Remove date suffix (e.g., "-20250929")
  name = name.replace(/-\d{8}$/, '');

  // Convert hyphens to spaces and capitalize
  name = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return name;
}
