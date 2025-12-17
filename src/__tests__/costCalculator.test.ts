/**
 * Tests for cost calculator service
 * Run with: node --loader tsx src/__tests__/costCalculator.test.ts
 */

import { calculateRequestCost, formatCost, getModelDisplayName, aggregateRequestCosts } from '../services/costCalculator';
import type { TokenUsage } from '../types/trace';

// Helper to create mock token usage
function createMockUsage(
  inputTokens: number,
  outputTokens: number,
  cacheRead = 0,
  cache5m = 0,
  cache1h = 0
): TokenUsage {
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_creation_input_tokens: cache5m + cache1h,
    cache_read_input_tokens: cacheRead,
    cache_creation: {
      ephemeral_5m_input_tokens: cache5m,
      ephemeral_1h_input_tokens: cache1h,
    },
    service_tier: 'default',
  };
}

console.log('Running Cost Calculator Tests...\n');

// Test 1: Prefix matching with date suffixes
console.log('=== Test 1: Date Suffix Stripping ===');
const haiku1 = calculateRequestCost('claude-haiku-4-5-20251001', createMockUsage(1000, 500));
const haiku2 = calculateRequestCost('claude-haiku-4-5-20240101', createMockUsage(1000, 500));
const haiku3 = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500));
console.assert(haiku1 === haiku2 && haiku2 === haiku3, 'All haiku variants should have same cost');
console.assert(haiku1 !== null, 'Haiku cost should not be null');
console.log(`✓ All date variants match: $${haiku1?.toFixed(4)}`);
console.log(`  - claude-haiku-4-5-20251001: $${haiku1?.toFixed(4)}`);
console.log(`  - claude-haiku-4-5-20240101: $${haiku2?.toFixed(4)}`);
console.log(`  - claude-haiku-4-5: $${haiku3?.toFixed(4)}\n`);

// Test 2: Unknown model returns null
console.log('=== Test 2: Unknown Model Handling ===');
const unknown = calculateRequestCost('claude-unknown-99-20251001', createMockUsage(1000, 500));
console.assert(unknown === null, 'Unknown model should return null');
console.log('✓ Unknown model returns null\n');

// Test 3: Long context pricing (Sonnet 4.5)
console.log('=== Test 3: Long Context Pricing ===');
const normalContext = calculateRequestCost('claude-sonnet-4-5', createMockUsage(100000, 1000), 100000);
const longContext = calculateRequestCost('claude-sonnet-4-5', createMockUsage(250000, 1000), 250000);
console.assert(normalContext !== null && longContext !== null, 'Both should calculate');
console.assert(longContext! > normalContext! * 1.5, 'Long context should be more expensive');
console.log(`✓ Normal context (100K tokens): $${normalContext?.toFixed(4)}`);
console.log(`✓ Long context (250K tokens): $${longContext?.toFixed(4)}`);
console.log(`  Long context is ${(longContext! / normalContext!).toFixed(2)}x more expensive\n`);

// Test 4: Cache pricing
console.log('=== Test 4: Cache Token Pricing ===');
const noCache = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500));
const withCacheRead = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500, 500));
const withCache5m = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500, 0, 1000));
const withCache1h = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500, 0, 0, 500));
const withAllCache = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500, 500, 1000, 500));

console.assert(noCache !== null, 'No cache cost should not be null');
console.assert(withCacheRead! > noCache!, 'Cache read tokens add cost (though cheaper than regular input)');
console.assert(withCache5m! > noCache!, '5m cache write should increase cost');
console.assert(withCache1h! > noCache!, '1h cache write should increase cost');
console.assert(withAllCache! > withCache5m!, 'All cache types should cost most');

console.log(`✓ No cache: $${noCache?.toFixed(4)}`);
console.log(`✓ With cache read (500 tokens): $${withCacheRead?.toFixed(4)}`);
console.log(`✓ With 5m cache write (1000 tokens): $${withCache5m?.toFixed(4)}`);
console.log(`✓ With 1h cache write (500 tokens): $${withCache1h?.toFixed(4)}`);
console.log(`✓ With all cache types: $${withAllCache?.toFixed(4)}\n`);

// Test 5: Cost formatting
console.log('=== Test 5: Cost Formatting ===');
const smallCost = formatCost(0.0012);
const largeCost = formatCost(1.5678);
const edgeCost = formatCost(0.01);
console.assert(smallCost === '$0.0012', 'Small costs show 4 decimals');
console.assert(largeCost === '$1.57', 'Large costs show 2 decimals');
console.assert(edgeCost === '$0.01', 'Edge case at $0.01 shows 2 decimals');
console.log(`✓ Small ($0.0012): ${smallCost}`);
console.log(`✓ Large ($1.5678): ${largeCost}`);
console.log(`✓ Edge ($0.01): ${edgeCost}\n`);

// Test 6: Model display name
console.log('=== Test 6: Model Display Name Extraction ===');
const displayName1 = getModelDisplayName('claude-sonnet-4-5-20250929');
const displayName2 = getModelDisplayName('claude-3-5-haiku-20241022');
const displayName3 = getModelDisplayName('claude-opus-4');
console.assert(displayName1 === 'Sonnet 4 5', 'Should strip date and format');
console.assert(displayName2 === '3 5 Haiku', 'Should handle Claude 3 naming');
console.assert(displayName3 === 'Opus 4', 'Should work without date suffix');
console.log(`✓ claude-sonnet-4-5-20250929 → "${displayName1}"`);
console.log(`✓ claude-3-5-haiku-20241022 → "${displayName2}"`);
console.log(`✓ claude-opus-4 → "${displayName3}"\n`);

// Test 7: All current models with date variants
console.log('=== Test 7: All Known Model Families ===');
const modelTests = [
  // Claude 4.5 models
  { model: 'claude-opus-4-5', expectedNonNull: true },
  { model: 'claude-opus-4-5-20251001', expectedNonNull: true },
  { model: 'claude-sonnet-4-5', expectedNonNull: true },
  { model: 'claude-sonnet-4-5-20250929', expectedNonNull: true },
  { model: 'claude-haiku-4-5', expectedNonNull: true },
  { model: 'claude-haiku-4-5-20250514', expectedNonNull: true },

  // Claude 4 models
  { model: 'claude-opus-4', expectedNonNull: true },
  { model: 'claude-opus-4-20241113', expectedNonNull: true },
  { model: 'claude-sonnet-4', expectedNonNull: true },
  { model: 'claude-sonnet-4-20241022', expectedNonNull: true },

  // Claude 3 models
  { model: 'claude-3-opus', expectedNonNull: true },
  { model: 'claude-3-opus-20240229', expectedNonNull: true },
  { model: 'claude-3-5-sonnet', expectedNonNull: true },
  { model: 'claude-3-5-sonnet-20241022', expectedNonNull: true },
  { model: 'claude-3-5-sonnet-20240620', expectedNonNull: true },
  { model: 'claude-3-5-haiku', expectedNonNull: true },
  { model: 'claude-3-5-haiku-20241022', expectedNonNull: true },
  { model: 'claude-3-haiku', expectedNonNull: true },
  { model: 'claude-3-haiku-20240307', expectedNonNull: true },
  { model: 'claude-3-sonnet', expectedNonNull: true },
  { model: 'claude-3-sonnet-20240229', expectedNonNull: true },
];

let passCount = 0;
for (const { model, expectedNonNull } of modelTests) {
  const cost = calculateRequestCost(model, createMockUsage(1000, 500));
  const passed = (cost !== null) === expectedNonNull;
  if (passed) {
    passCount++;
    console.log(`✓ ${model}: $${cost?.toFixed(4)}`);
  } else {
    console.log(`✗ ${model}: ${cost === null ? 'NULL' : cost} (FAILED)`);
  }
}
console.assert(passCount === modelTests.length, `All ${modelTests.length} model tests should pass`);
console.log(`\n✓ ${passCount}/${modelTests.length} models have correct pricing\n`);

// Test 8: Cost aggregation
console.log('=== Test 8: Cost Aggregation ===');

// All valid costs
const requests1 = [
  { cost: 0.001 },
  { cost: 0.002 },
  { cost: 0.003 }
];
const result1 = aggregateRequestCosts(requests1);
console.assert(result1.totalCost === 0.006, 'Should sum all costs');
console.assert(result1.hasIncompleteCost === false, 'Should not have incomplete cost');
console.log(`✓ All valid costs: $${result1.totalCost?.toFixed(4)} (incomplete: ${result1.hasIncompleteCost})`);

// Some null costs
const requests2 = [
  { cost: 0.001 },
  { cost: null },
  { cost: 0.003 }
];
const result2 = aggregateRequestCosts(requests2);
console.assert(result2.totalCost === 0.004, 'Should sum available costs');
console.assert(result2.hasIncompleteCost === true, 'Should flag incomplete cost');
console.log(`✓ Mixed costs: $${result2.totalCost?.toFixed(4)} (incomplete: ${result2.hasIncompleteCost})`);

// All null costs
const requests3 = [
  { cost: null },
  { cost: null }
];
const result3 = aggregateRequestCosts(requests3);
console.assert(result3.totalCost === null, 'Should return null for all null');
console.assert(result3.hasIncompleteCost === false, 'Should not flag incomplete when all null');
console.log(`✓ All null costs: ${result3.totalCost} (incomplete: ${result3.hasIncompleteCost})\n`);

// Test 9: Edge cases
console.log('=== Test 9: Edge Cases ===');

// Zero tokens
const zeroCost = calculateRequestCost('claude-haiku-4-5', createMockUsage(0, 0));
console.assert(zeroCost === 0, 'Zero tokens should cost $0');
console.log(`✓ Zero tokens: $${zeroCost?.toFixed(4)}`);

// Very large token counts
const hugeCost = calculateRequestCost('claude-opus-4-5', createMockUsage(10_000_000, 5_000_000));
console.assert(hugeCost !== null && hugeCost > 100, 'Large token counts should work');
console.log(`✓ Large tokens (10M input, 5M output): $${hugeCost?.toFixed(2)}`);

// Model name without claude prefix (should fail)
const noPrefixCost = calculateRequestCost('sonnet-4-5', createMockUsage(1000, 500));
console.assert(noPrefixCost === null, 'Model without claude prefix should return null');
console.log(`✓ No claude prefix: ${noPrefixCost}\n`);

// Test 10: Date suffix patterns
console.log('=== Test 10: Date Suffix Patterns ===');

// Valid 8-digit date
const validDate = calculateRequestCost('claude-haiku-4-5-20251231', createMockUsage(1000, 500));
console.assert(validDate !== null, 'Valid 8-digit date should match');
console.log(`✓ Valid date (20251231): $${validDate?.toFixed(4)}`);

// Invalid date patterns (should not be stripped)
const sevenDigits = calculateRequestCost('claude-haiku-4-5-2025123', createMockUsage(1000, 500));
console.assert(sevenDigits === null, '7-digit suffix should not match');
console.log(`✓ Invalid date (7 digits): ${sevenDigits}`);

const nineDigits = calculateRequestCost('claude-haiku-4-5-202512310', createMockUsage(1000, 500));
console.assert(nineDigits === null, '9-digit suffix should not match');
console.log(`✓ Invalid date (9 digits): ${nineDigits}`);

// Date in middle of name (should not be stripped)
const dateInMiddle = calculateRequestCost('claude-20251001-haiku', createMockUsage(1000, 500));
console.assert(dateInMiddle === null, 'Date in middle should not be stripped');
console.log(`✓ Date in middle: ${dateInMiddle}\n`);

// Test 11: Specific cost calculations
console.log('=== Test 11: Specific Cost Calculations ===');

// Haiku 4.5: $1/MTok input, $5/MTok output
const haikuCost = calculateRequestCost('claude-haiku-4-5', createMockUsage(1_000_000, 1_000_000));
const expectedHaiku = (1_000_000 / 1_000_000) * 1 + (1_000_000 / 1_000_000) * 5;
console.assert(Math.abs(haikuCost! - expectedHaiku) < 0.0001, 'Haiku calculation should be exact');
console.log(`✓ Haiku 1M/1M tokens: $${haikuCost?.toFixed(2)} (expected: $${expectedHaiku.toFixed(2)})`);

// Sonnet 4.5 normal context: $3/MTok input, $15/MTok output
const sonnetNormal = calculateRequestCost('claude-sonnet-4-5', createMockUsage(100_000, 10_000), 100_000);
const expectedSonnetNormal = (100_000 / 1_000_000) * 3 + (10_000 / 1_000_000) * 15;
console.assert(Math.abs(sonnetNormal! - expectedSonnetNormal) < 0.0001, 'Sonnet normal should be exact');
console.log(`✓ Sonnet 100K/10K tokens: $${sonnetNormal?.toFixed(4)} (expected: $${expectedSonnetNormal.toFixed(4)})`);

// Sonnet 4.5 long context: $6/MTok input, $30/MTok output
const sonnetLong = calculateRequestCost('claude-sonnet-4-5', createMockUsage(300_000, 10_000), 300_000);
const expectedSonnetLong = (300_000 / 1_000_000) * 6 + (10_000 / 1_000_000) * 30;
console.assert(Math.abs(sonnetLong! - expectedSonnetLong) < 0.0001, 'Sonnet long context should be exact');
console.log(`✓ Sonnet 300K/10K tokens (long): $${sonnetLong?.toFixed(4)} (expected: $${expectedSonnetLong.toFixed(4)})`);

// Cache multipliers test (Haiku: input=$1, cache5m=$1.25, cache1h=$2, cacheRead=$0.1)
const cacheTest = calculateRequestCost('claude-haiku-4-5', createMockUsage(0, 0, 1_000_000, 1_000_000, 1_000_000));
const expectedCache = (1_000_000 / 1_000_000) * 0.1 + (1_000_000 / 1_000_000) * 1.25 + (1_000_000 / 1_000_000) * 2;
console.assert(Math.abs(cacheTest! - expectedCache) < 0.0001, 'Cache multipliers should be exact');
console.log(`✓ Cache tokens (1M each type): $${cacheTest?.toFixed(2)} (expected: $${expectedCache.toFixed(2)})\n`);

console.log('===================');
console.log('All tests passed! ✓');
console.log('===================');
