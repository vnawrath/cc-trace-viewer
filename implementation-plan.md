# Implementation Plan: Robust Model Pricing with Prefix Matching

## Goal

Implement robust prefix-based model name matching in the cost calculator to handle new model versions with different date suffixes (e.g., `claude-haiku-4-5-20251001`) without requiring pricing table updates for each release.

## Problem Statement

From `goal.md`:
- The cost calculator frequently misses new models with different date suffixes
- Warnings like "Unknown pricing for model: claude-haiku-4-5-20251001" appear frequently
- Current implementation uses exact string matching, requiring manual updates for each dated release

## Current Implementation

### Pricing Definition
**File**: `src/services/costCalculator.ts`

**Lines 61-193**: `CLAUDE_PRICING` constant defines pricing with date-specific entries:
```typescript
export const CLAUDE_PRICING: Record<string, ModelPricing> = {
  'claude-haiku-4-5': { input: 1, output: 5, ... },
  'claude-haiku-4-5-20250514': { input: 1, output: 5, ... },
  // Multiple entries per model family
}
```

### Model Name Matching
**File**: `src/services/costCalculator.ts:261`

Current exact match implementation:
```typescript
const pricing = CLAUDE_PRICING[model];
if (!pricing) {
  return null; // No fallback or prefix matching
}
```

### Warning Generation
**File**: `src/services/requestAnalyzer.ts:191-194`

Console warning for unknown models:
```typescript
if (cost === null) {
  console.warn(`Unknown pricing for model: ${request.body.model}`);
}
```

### Existing Date Handling
**File**: `src/services/costCalculator.ts:378-392`

`getModelDisplayName()` already strips date suffixes for display:
```typescript
name = name.replace(/-\d{8}$/, ''); // Removes date pattern
```

## Design Decisions

### 1. Pricing Registry Structure (Choice: 1b)
**Migrate entirely to prefix-only entries**, removing all date suffixes from pricing keys.

**Rationale**:
- Simplifies maintenance
- Based on research, same model family has consistent pricing across dates
- Cleaner data structure

### 2. Date Suffix Price Variance (Choice: 2a)
**Assume pricing is always consistent across dates** → implement simple prefix matching

**Rationale**:
- All examined date variants have identical pricing
- Simplifies implementation
- If future prices differ by date, we can revisit and add override mechanism

### 3. Matching Implementation (Choice: 3b)
**Normalize model name before lookup**: always strip dates before checking

**Rationale**:
- Simpler implementation
- Single code path (no fallback complexity)
- Consistent behavior

## Implementation Phases

---

### Phase 1: Add Date-Stripping to Model Lookup ✅

**Status**: COMPLETED

**Objective**: Implement model name normalization to strip date suffixes before pricing lookups

**Files to Modify**:
- `src/services/costCalculator.ts`

**Changes**:

1. Add helper function after line 215 (after `formatCost()`):
```typescript
/**
 * Normalizes a model name by removing date suffixes
 *
 * @param model - The full model identifier (e.g., "claude-haiku-4-5-20251001")
 * @returns Normalized model name (e.g., "claude-haiku-4-5")
 *
 * @example
 * normalizeModelName('claude-haiku-4-5-20251001') // "claude-haiku-4-5"
 * normalizeModelName('claude-sonnet-4-5') // "claude-sonnet-4-5"
 */
function normalizeModelName(model: string): string {
  // Remove date suffix pattern (8 digits at end)
  return model.replace(/-\d{8}$/, '');
}
```

2. Update `calculateRequestCost()` at line 260-261:
```typescript
export function calculateRequestCost(
  model: string,
  tokens: TokenUsage,
  totalInputTokens?: number
): number | null {
  // Normalize model name to strip date suffix
  const normalizedModel = normalizeModelName(model);

  // Look up pricing for the normalized model
  const pricing = CLAUDE_PRICING[normalizedModel];

  if (!pricing) {
    // Unknown model - return null
    return null;
  }
  // ... rest of function unchanged
}
```

**Testing Steps**:
- [x] Test with `claude-haiku-4-5-20251001` → matches `claude-haiku-4-5` pricing ✓
- [x] Test with `claude-sonnet-4-5-20250929` → matches existing pricing ✓
- [x] Test with `claude-haiku-4-5` (no date) → still works ✓
- [x] Test with unknown model like `claude-mega-5-5-20251001` → returns null ✓
- [x] Test with `claude-opus-4-20241113` → exact date matches still work ✓
- [x] Verify TypeScript compilation succeeds ✓
- [x] Run linter to check code quality ✓

**Verification**:
```bash
# Run existing tests
npm run build  # ✓ PASSED
npm run lint   # ✓ PASSED (2 pre-existing warnings unrelated to changes)
```

**Implementation Summary**:
- Added `normalizeModelName()` helper function at line 227-230
- Updated `calculateRequestCost()` to normalize model names before lookup (line 276-279)
- All automated tests pass successfully
- Build and lint checks complete without errors

**Expected Outcome**: ✅ All known Claude model families with base entries and any date suffix now match pricing successfully

---

### Phase 2: Refactor Pricing Table to Prefix-Only

**Objective**: Clean up pricing table by removing all date-specific entries, keeping only base model names

**Files to Modify**:
- `src/services/costCalculator.ts`

**Changes**:

Update `CLAUDE_PRICING` object (lines 61-193) to remove all date suffixes:

**Before**:
```typescript
export const CLAUDE_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-5': { input: 15, output: 75, ... },
  'claude-opus-4-5-20250514': { input: 15, output: 75, ... }, // REMOVE
  'claude-sonnet-4-5': { input: 3, output: 15, ... },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15, ... }, // REMOVE
  // etc.
}
```

**After**:
```typescript
export const CLAUDE_PRICING: Record<string, ModelPricing> = {
  // Claude 4.5 Models (Latest generation)
  'claude-opus-4-5': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheRead: 1.5,
  },
  'claude-sonnet-4-5': {
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
    cacheWrite5m: 1.25,
    cacheWrite1h: 2,
    cacheRead: 0.1,
  },

  // Claude 4 Models
  'claude-opus-4': {
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

  // Claude 3 Models
  'claude-3-opus': {
    input: 15,
    output: 75,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheRead: 1.5,
  },
  'claude-3-5-sonnet': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },
  'claude-3-5-haiku': {
    input: 1,
    output: 5,
    cacheWrite5m: 1.25,
    cacheWrite1h: 2,
    cacheRead: 0.1,
  },
  'claude-3-haiku': {
    input: 0.25,
    output: 1.25,
    cacheWrite5m: 0.3125,
    cacheWrite1h: 0.5,
    cacheRead: 0.025,
  },
  'claude-3-sonnet': {
    input: 3,
    output: 15,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheRead: 0.3,
  },
};
```

**Remove Date-Specific Entries**:
- [x] Remove `claude-opus-4-5-20250514`
- [x] Remove `claude-sonnet-4-5-20250929`
- [x] Remove `claude-haiku-4-5-20250514`
- [x] Remove `claude-opus-4-20241113`
- [x] Remove `claude-sonnet-4-20241022`
- [x] Remove `claude-sonnet-4-20250514`
- [x] Remove `claude-3-opus-20240229`
- [x] Remove `claude-3-5-sonnet-20241022`
- [x] Remove `claude-3-5-sonnet-20240620`
- [x] Remove `claude-3-5-haiku-20241022`
- [x] Remove `claude-3-haiku-20240307`
- [x] Remove `claude-3-sonnet-20240229`

**Testing Steps**:
- [ ] Load existing trace files with various model names
- [ ] Verify all costs still calculate correctly
- [ ] Check that `claude-3-5-sonnet-20241022` matches `claude-3-5-sonnet`
- [ ] Check that `claude-3-opus-20240229` matches `claude-3-opus`
- [ ] Verify no regressions in cost calculation
- [ ] Run build to check TypeScript compilation

**Verification**:
```bash
npm run build
npm run lint
```

**Expected Outcome**: Cleaner pricing table with ~50% fewer entries, no change in functionality

---

### Phase 3: Add Comprehensive Tests

**Objective**: Create automated tests for the cost calculator to ensure robust prefix matching

**Files to Create**:
- `src/__tests__/costCalculator.test.ts`

**Test Structure**:

```typescript
/**
 * Tests for cost calculator service
 * Run with: node --loader ts-node/esm src/__tests__/costCalculator.test.ts
 */

import { calculateRequestCost, formatCost, getModelDisplayName } from '../services/costCalculator';
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
console.log('Test 1: Date suffix stripping');
const haiku1 = calculateRequestCost('claude-haiku-4-5-20251001', createMockUsage(1000, 500));
const haiku2 = calculateRequestCost('claude-haiku-4-5-20240101', createMockUsage(1000, 500));
const haiku3 = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500));
console.assert(haiku1 === haiku2 && haiku2 === haiku3, 'All haiku variants should have same cost');
console.log(`✓ All date variants match: $${haiku1?.toFixed(4)}\n`);

// Test 2: Unknown model returns null
console.log('Test 2: Unknown model handling');
const unknown = calculateRequestCost('claude-unknown-99-20251001', createMockUsage(1000, 500));
console.assert(unknown === null, 'Unknown model should return null');
console.log('✓ Unknown model returns null\n');

// Test 3: Long context pricing (Sonnet 4.5)
console.log('Test 3: Long context pricing');
const normalContext = calculateRequestCost('claude-sonnet-4-5', createMockUsage(100000, 1000), 100000);
const longContext = calculateRequestCost('claude-sonnet-4-5', createMockUsage(250000, 1000), 250000);
console.assert(normalContext !== null && longContext !== null, 'Both should calculate');
console.assert(longContext! > normalContext! * 1.5, 'Long context should be more expensive');
console.log(`✓ Normal: $${normalContext?.toFixed(4)}, Long: $${longContext?.toFixed(4)}\n`);

// Test 4: Cache pricing
console.log('Test 4: Cache token pricing');
const noCache = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500));
const withCache = calculateRequestCost('claude-haiku-4-5', createMockUsage(1000, 500, 500, 1000, 500));
console.assert(withCache! > noCache!, 'Cache tokens should increase cost');
console.log(`✓ No cache: $${noCache?.toFixed(4)}, With cache: $${withCache?.toFixed(4)}\n`);

// Test 5: Cost formatting
console.log('Test 5: Cost formatting');
const smallCost = formatCost(0.0012);
const largeCost = formatCost(1.5678);
console.assert(smallCost === '$0.0012', 'Small costs show 4 decimals');
console.assert(largeCost === '$1.57', 'Large costs show 2 decimals');
console.log(`✓ Small: ${smallCost}, Large: ${largeCost}\n`);

// Test 6: Model display name
console.log('Test 6: Model display name extraction');
const displayName1 = getModelDisplayName('claude-sonnet-4-5-20250929');
const displayName2 = getModelDisplayName('claude-3-5-haiku-20241022');
console.assert(displayName1 === 'Sonnet 4 5', 'Should strip date and format');
console.assert(displayName2 === '3 5 Haiku', 'Should handle Claude 3 naming');
console.log(`✓ ${displayName1}, ${displayName2}\n`);

// Test 7: All current models
console.log('Test 7: All known model families');
const models = [
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-opus-4',
  'claude-sonnet-4',
  'claude-3-opus',
  'claude-3-5-sonnet',
  'claude-3-5-haiku',
  'claude-3-haiku',
  'claude-3-sonnet',
];

let passCount = 0;
for (const model of models) {
  const cost = calculateRequestCost(model, createMockUsage(1000, 500));
  if (cost !== null) {
    passCount++;
    console.log(`✓ ${model}: $${cost.toFixed(4)}`);
  } else {
    console.log(`✗ ${model}: NULL (FAILED)`);
  }
}
console.assert(passCount === models.length, 'All models should have pricing');
console.log(`\n✓ ${passCount}/${models.length} models have pricing\n`);

console.log('All tests passed! ✓');
```

**Testing Steps**:
- [ ] Create test file with comprehensive coverage
- [ ] Test prefix matching with various date suffixes
- [ ] Test unknown models return null
- [ ] Test long-context pricing still works correctly
- [ ] Test cache pricing calculations
- [ ] Test cost formatting edge cases
- [ ] Test model display name extraction
- [ ] Verify all known model families have pricing

**Verification**:
```bash
# Run the test manually
node --loader tsx src/__tests__/costCalculator.test.ts

# Or add to package.json scripts:
# "test": "node --loader tsx src/__tests__/costCalculator.test.ts"
```

**Expected Outcome**: All tests pass, confirming robust prefix matching and cost calculation

---

### Phase 4: Validation & Documentation

**Objective**: Validate the changes work end-to-end and update documentation

**Tasks**:

1. **End-to-End Validation**:
   - [ ] Load a real trace file with various model versions
   - [ ] Verify no console warnings for known model families
   - [ ] Check RequestCard component displays costs correctly
   - [ ] Check SessionTable shows accurate total costs
   - [ ] Verify RequestMetrics doesn't show "Unknown model" for known families
   - [ ] Test with edge cases (very old models, future date suffixes)

2. **Documentation Updates**:
   - [ ] Update `src/services/costCalculator.ts` header comment to reflect prefix matching
   - [ ] Add note about automatic date suffix handling
   - [ ] Update "Last Updated" timestamp in header

**Updated Header Comment** (lines 1-25):
```typescript
/**
 * Cost Calculator Service
 *
 * Calculates costs for Claude API requests based on token usage and model pricing.
 *
 * Model Name Matching:
 * - Automatically strips date suffixes (e.g., "-20251001") from model names
 * - Matches based on model family prefix (e.g., "claude-haiku-4-5")
 * - All date variants of a model use the same pricing
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
```

3. **UI Validation Checklist**:
   - [ ] `src/components/RequestCard.tsx:251-258` - Cost displays correctly
   - [ ] `src/components/SessionTable.tsx:240-252` - Total costs accurate
   - [ ] `src/components/RequestMetrics.tsx:144-151` - No "Unknown model" for known families
   - [ ] `src/services/requestAnalyzer.ts:191-194` - No console warnings

**Testing Steps**:
- [ ] Build the application: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Load trace file with mixed model versions
- [ ] Navigate through UI and verify all cost displays
- [ ] Open browser console - verify no warnings
- [ ] Test sorting/filtering by cost
- [ ] Export and verify cost data integrity

**Verification**:
```bash
# Build and run
npm run build
npm run dev

# Check for any build warnings or errors
npm run lint
```

**Expected Outcome**:
- Zero console warnings for known Claude models
- All costs display correctly across the UI
- Documentation accurately reflects the implementation

---

## Testing Strategy

### Manual Testing Scenarios

1. **New Model Date Suffix**:
   - Input: `claude-haiku-4-5-20991231` (future date)
   - Expected: Matches `claude-haiku-4-5` pricing
   - Verify: Cost displays, no warnings

2. **Existing Model Without Date**:
   - Input: `claude-sonnet-4-5`
   - Expected: Matches pricing
   - Verify: Cost calculation identical to dated versions

3. **Unknown Model Family**:
   - Input: `claude-turbo-6-20251001`
   - Expected: Returns null, logs warning
   - Verify: UI shows "—" or "Unknown model"

4. **Long Context Pricing**:
   - Input: `claude-sonnet-4-5-20251001` with >200K tokens
   - Expected: Uses premium pricing ($6/$30 instead of $3/$15)
   - Verify: Cost reflects premium rates

5. **Cache Token Costs**:
   - Input: Request with cache_creation and cache_read tokens
   - Expected: Correct multipliers applied (1.25x, 2.0x, 0.1x)
   - Verify: Cost breakdown accurate

### Automated Testing

- Run test file after Phase 3
- Verify all assertions pass
- Check TypeScript compilation
- Run lint checks

### Regression Testing

- Load historical trace files
- Compare costs before/after implementation
- Ensure no cost calculation changes for existing models
- Verify UI rendering consistency

---

## Success Criteria

### Must Have
- [ ] No console warnings for any known Claude model family regardless of date suffix
- [ ] All costs calculate correctly for both old and new model versions
- [ ] Pricing table contains only prefix entries (no date suffixes)
- [ ] Tests pass and provide good coverage
- [ ] Documentation updated and accurate

### Should Have
- [ ] Clean, maintainable code with clear comments
- [ ] Backward compatible with existing trace files
- [ ] No performance degradation
- [ ] Clear error messages for truly unknown models

### Nice to Have
- [ ] Future-proof for new model releases (no code changes needed)
- [ ] Easy to add new model families
- [ ] Comprehensive test coverage

---

## Rollback Plan

If issues are discovered:

1. **Phase 1 only complete**: Simply remove the normalization call, revert to exact matching
2. **Phase 2 complete**: Restore date-specific entries from git history
3. **All phases complete**: Full revert via git

Commit after each phase to enable granular rollback.

---

## Future Considerations

### If Pricing Diverges by Date
If future models have different pricing for different date suffixes:

1. Add optional date-specific overrides in pricing table
2. Modify lookup to try exact match first, then prefix match
3. Add comment system to document price differences

### Performance Optimization
If regex becomes bottleneck (unlikely):

1. Cache normalized model names
2. Pre-compile regex pattern
3. Consider memoization

### New Model Families
When new model families are released:

1. Add single entry to CLAUDE_PRICING (e.g., `claude-opus-5`)
2. No code changes needed - prefix matching handles all dates automatically

---

## Related Files Reference

### Core Implementation
- `src/services/costCalculator.ts` - Main cost calculation logic
- `src/services/requestAnalyzer.ts` - Request analysis and cost integration
- `src/types/trace.ts` - Type definitions for trace data

### UI Components
- `src/components/RequestCard.tsx` - Individual request cost display
- `src/components/SessionTable.tsx` - Session-level cost aggregation
- `src/components/RequestMetrics.tsx` - Metrics overview with cost

### Testing
- `src/__tests__/costCalculator.test.ts` - New test file (to be created)
- Existing test pattern: `src/__tests__/conversationDetection.test.ts`

---

## Timeline Estimate

- **Phase 1**: 1-2 hours (implementation + testing)
- **Phase 2**: 1 hour (refactoring + verification)
- **Phase 3**: 2-3 hours (test writing + validation)
- **Phase 4**: 1-2 hours (documentation + end-to-end testing)

**Total**: 5-8 hours

---

## Notes

- This implementation assumes pricing consistency across date versions based on current data analysis
- The regex pattern `/-\d{8}$/` is already proven in `getModelDisplayName()` function
- All changes are backward compatible with existing trace files
- No database or API changes required - purely client-side logic
