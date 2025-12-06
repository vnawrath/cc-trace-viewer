/**
 * Test script for Cost Calculator Service
 * Run with: npx tsx test-cost-calculator.ts
 */

import {
  calculateRequestCost,
  formatCost,
  getModelDisplayName,
  CLAUDE_PRICING,
} from './src/services/costCalculator';
import { TokenUsage } from './src/types/trace';

// Test result tracking
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
    console.log(`✓ ${message}`);
  } else {
    failCount++;
    console.error(`✗ ${message}`);
  }
}

function assertClose(actual: number, expected: number, message: string, tolerance = 0.000001) {
  const diff = Math.abs(actual - expected);
  if (diff < tolerance) {
    passCount++;
    console.log(`✓ ${message} (${actual})`);
  } else {
    failCount++;
    console.error(`✗ ${message} - Expected ${expected}, got ${actual}`);
  }
}

console.log('=== Cost Calculator Service Tests ===\n');

// Test 1: Format Cost Function
console.log('Test 1: formatCost()');
assert(formatCost(0.0012) === '$0.0012', 'Small cost (<$0.01) uses 4 decimals');
assert(formatCost(0.009999) === '$0.0100', 'Cost just under $0.01 rounds to 4 decimals');
assert(formatCost(0.01) === '$0.01', 'Cost at $0.01 uses 2 decimals');
assert(formatCost(1.5678) === '$1.57', 'Large cost (>=$0.01) uses 2 decimals');
assert(formatCost(0.0001) === '$0.0001', 'Very small cost uses 4 decimals');
assert(formatCost(123.456) === '$123.46', 'Very large cost rounds to 2 decimals');
console.log();

// Test 2: Basic Cost Calculation - Sonnet 4.5
console.log('Test 2: calculateRequestCost() - Sonnet 4.5');
const sonnetTokens: TokenUsage = {
  input_tokens: 1000,
  output_tokens: 500,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: {
    ephemeral_5m_input_tokens: 0,
    ephemeral_1h_input_tokens: 0,
  },
  service_tier: 'default',
};
const sonnetCost = calculateRequestCost('claude-sonnet-4-5', sonnetTokens);
// Expected: (1000/1M × $3) + (500/1M × $15) = $0.003 + $0.0075 = $0.0105
assertClose(sonnetCost!, 0.0105, 'Sonnet 4.5 basic calculation');
console.log();

// Test 3: Unknown Model
console.log('Test 3: calculateRequestCost() - Unknown Model');
const unknownCost = calculateRequestCost('claude-unknown-model', sonnetTokens);
assert(unknownCost === null, 'Unknown model returns null');
console.log();

// Test 4: Long-Context Pricing - Sonnet 4.5
console.log('Test 4: calculateRequestCost() - Sonnet 4.5 Long-Context');
const longContextTokens: TokenUsage = {
  input_tokens: 250000,
  output_tokens: 1000,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: {
    ephemeral_5m_input_tokens: 0,
    ephemeral_1h_input_tokens: 0,
  },
  service_tier: 'default',
};
const longContextCost = calculateRequestCost('claude-sonnet-4-5', longContextTokens, 250000);
// Expected: (250000/1M × $6) + (1000/1M × $30) = $1.50 + $0.03 = $1.53
assertClose(longContextCost!, 1.53, 'Sonnet 4.5 long-context (>200K tokens)');

// Test that same tokens without totalInputTokens parameter uses standard pricing
const standardCost = calculateRequestCost('claude-sonnet-4-5', longContextTokens);
// Expected: (250000/1M × $3) + (1000/1M × $15) = $0.75 + $0.015 = $0.765
assertClose(standardCost!, 0.765, 'Sonnet 4.5 without totalInputTokens uses standard pricing');
console.log();

// Test 5: Cache Token Pricing
console.log('Test 5: calculateRequestCost() - Cache Tokens');
const cacheTokens: TokenUsage = {
  input_tokens: 1000,
  output_tokens: 500,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 5000,
  cache_creation: {
    ephemeral_5m_input_tokens: 2000,
    ephemeral_1h_input_tokens: 1000,
  },
  service_tier: 'default',
};
const cacheCost = calculateRequestCost('claude-sonnet-4-5', cacheTokens);
// Expected:
// - Input: 1000/1M × $3 = $0.003
// - Output: 500/1M × $15 = $0.0075
// - Cache 5m: 2000/1M × $3.75 = $0.0075
// - Cache 1h: 1000/1M × $6 = $0.006
// - Cache read: 5000/1M × $0.3 = $0.0015
// Total: $0.0255
assertClose(cacheCost!, 0.0255, 'Cache tokens pricing calculation');
console.log();

// Test 6: Different Models
console.log('Test 6: calculateRequestCost() - Different Models');
const basicTokens: TokenUsage = {
  input_tokens: 1000,
  output_tokens: 1000,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: {
    ephemeral_5m_input_tokens: 0,
    ephemeral_1h_input_tokens: 0,
  },
  service_tier: 'default',
};

// Opus 4.5: (1000/1M × $15) + (1000/1M × $75) = $0.015 + $0.075 = $0.09
const opusCost = calculateRequestCost('claude-opus-4-5', basicTokens);
assertClose(opusCost!, 0.09, 'Opus 4.5 calculation');

// Haiku 4.5: (1000/1M × $1) + (1000/1M × $5) = $0.001 + $0.005 = $0.006
const haikuCost = calculateRequestCost('claude-haiku-4-5', basicTokens);
assertClose(haikuCost!, 0.006, 'Haiku 4.5 calculation');

// Claude 3 Haiku: (1000/1M × $0.25) + (1000/1M × $1.25) = $0.00025 + $0.00125 = $0.0015
const claude3HaikuCost = calculateRequestCost('claude-3-haiku-20240307', basicTokens);
assertClose(claude3HaikuCost!, 0.0015, 'Claude 3 Haiku calculation');
console.log();

// Test 7: Model Display Names
console.log('Test 7: getModelDisplayName()');
assert(getModelDisplayName('claude-sonnet-4-5-20250929') === 'Sonnet 4 5', 'Sonnet 4.5 with date');
assert(getModelDisplayName('claude-opus-4') === 'Opus 4', 'Opus 4 without date');
assert(getModelDisplayName('claude-3-haiku-20240307') === '3 Haiku', 'Claude 3 Haiku');
assert(getModelDisplayName('claude-3-5-sonnet-20241022') === '3 5 Sonnet', 'Claude 3.5 Sonnet');
console.log();

// Test 8: Pricing Coverage
console.log('Test 8: Pricing Coverage');
const expectedModels = [
  // Claude 4.5
  'claude-opus-4-5',
  'claude-opus-4-5-20250514',
  'claude-sonnet-4-5',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5',
  'claude-haiku-4-5-20250514',
  // Claude 4
  'claude-opus-4',
  'claude-opus-4-20241113',
  'claude-sonnet-4',
  'claude-sonnet-4-20241022',
  // Claude 3
  'claude-3-opus-20240229',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
  'claude-3-sonnet-20240229',
];

expectedModels.forEach(model => {
  assert(CLAUDE_PRICING[model] !== undefined, `Pricing exists for ${model}`);
});
console.log();

// Test 9: Edge Cases
console.log('Test 9: Edge Cases');

// Zero tokens
const zeroTokens: TokenUsage = {
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: {
    ephemeral_5m_input_tokens: 0,
    ephemeral_1h_input_tokens: 0,
  },
  service_tier: 'default',
};
const zeroCost = calculateRequestCost('claude-sonnet-4-5', zeroTokens);
assertClose(zeroCost!, 0, 'Zero tokens results in zero cost');

// Very large tokens
const largeTokens: TokenUsage = {
  input_tokens: 1000000,
  output_tokens: 500000,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation: {
    ephemeral_5m_input_tokens: 0,
    ephemeral_1h_input_tokens: 0,
  },
  service_tier: 'default',
};
const largeCost = calculateRequestCost('claude-sonnet-4-5', largeTokens);
// Expected: (1M/1M × $3) + (500K/1M × $15) = $3 + $7.5 = $10.5
assertClose(largeCost!, 10.5, 'Large token count calculation');
console.log();

// Summary
console.log('=== Test Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}
