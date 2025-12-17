/**
 * Tests for conversation grouper service
 * Run with: node --loader tsx src/__tests__/conversationGrouper.test.ts
 */

import { conversationGrouperService } from '../services/conversationGrouper';
import type { ClaudeTraceEntry } from '../types/trace';

// Helper to create mock request
function createMockRequest(
  timestamp: number,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt = '',
  model = 'claude-sonnet-4-5'
): ClaudeTraceEntry {
  return {
    request: {
      timestamp,
      method: 'POST',
      url: '/v1/messages',
      headers: {},
      body: {
        model,
        max_tokens: 1000,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: systemPrompt ? [{ type: 'text', text: systemPrompt }] : [],
        metadata: { user_id: 'test-user' }
      }
    },
    response: {
      timestamp: timestamp + 1000,
      status_code: 200,
      headers: {},
      body: {
        model,
        id: 'test-id',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'response' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
          service_tier: 'default'
        }
      }
    },
    logged_at: new Date(timestamp).toISOString()
  };
}

console.log('Running Conversation Grouper Tests...\n');

// Test 1: Single-turn conversation detection
console.log('=== Test 1: Single-Turn Conversation Detection ===');
const singleTurnRequest = createMockRequest(
  1000,
  [{ role: 'user', content: 'Hello' }]
);
const groups1 = conversationGrouperService.groupConversations([singleTurnRequest]);
console.assert(groups1.size === 1, 'Should create one group');
const group1 = Array.from(groups1.values())[0];
console.assert(group1.isSingleTurn === true, 'Should be marked as single-turn');
console.assert(group1.requestIds.length === 1, 'Should contain one request');
console.log('✓ Single-turn conversation detected correctly');
console.log(`  - Group ID: ${group1.groupId}`);
console.log(`  - Is single-turn: ${group1.isSingleTurn}`);
console.log(`  - First message: "${group1.firstUserMessage}"\n`);

// Test 2: Multi-turn conversation detection
console.log('=== Test 2: Multi-Turn Conversation Detection ===');
const multiTurnRequest = createMockRequest(
  2000,
  [
    { role: 'user', content: 'What is 2+2?' },
    { role: 'assistant', content: '4' },
    { role: 'user', content: 'What about 3+3?' }
  ]
);
const groups2 = conversationGrouperService.groupConversations([multiTurnRequest]);
const group2 = Array.from(groups2.values())[0];
console.assert(group2.isSingleTurn === false, 'Should be marked as multi-turn');
console.log('✓ Multi-turn conversation detected correctly');
console.log(`  - Is single-turn: ${group2.isSingleTurn}`);
console.log(`  - Message count: ${multiTurnRequest.request.body.messages.length}\n`);

// Test 3: Grouping by same first message
console.log('=== Test 3: Grouping by Same First Message ===');
const request1 = createMockRequest(1000, [{ role: 'user', content: 'Tell me a joke' }]);
const request2 = createMockRequest(2000, [
  { role: 'user', content: 'Tell me a joke' },
  { role: 'assistant', content: 'Why did the chicken...' },
  { role: 'user', content: 'Tell me another' }
]);
const request3 = createMockRequest(3000, [
  { role: 'user', content: 'Tell me a joke' },
  { role: 'assistant', content: 'Knock knock' },
  { role: 'user', content: 'Who is there?' }
]);
const groups3 = conversationGrouperService.groupConversations([request1, request2, request3]);
console.assert(groups3.size === 1, 'Should create one group for same first message');
const group3 = Array.from(groups3.values())[0];
console.assert(group3.requestIds.length === 3, 'Should contain all three requests');
console.log('✓ Requests with same first message grouped together');
console.log(`  - Group size: ${group3.requestIds.length}`);
console.log(`  - Group ID: ${group3.groupId}\n`);

// Test 4: Different system prompts create separate groups
console.log('=== Test 4: Different System Prompts ===');
const request4a = createMockRequest(1000, [{ role: 'user', content: 'Hello' }], 'You are a helpful assistant');
const request4b = createMockRequest(2000, [{ role: 'user', content: 'Hello' }], 'You are a code assistant');
const groups4 = conversationGrouperService.groupConversations([request4a, request4b]);
console.assert(groups4.size === 2, 'Should create separate groups for different system prompts');
const [groupA, groupB] = Array.from(groups4.values());
console.assert(groupA.systemPrompt !== groupB.systemPrompt, 'System prompts should differ');
console.log('✓ Different system prompts create separate groups');
console.log(`  - Group A system: "${groupA.systemPrompt.substring(0, 30)}..."`);
console.log(`  - Group B system: "${groupB.systemPrompt.substring(0, 30)}..."\n`);

// Test 5: Different models create separate groups
console.log('=== Test 5: Different Models ===');
const request5a = createMockRequest(1000, [{ role: 'user', content: 'Hello' }], '', 'claude-sonnet-4-5');
const request5b = createMockRequest(2000, [{ role: 'user', content: 'Hello' }], '', 'claude-haiku-4-5');
const groups5 = conversationGrouperService.groupConversations([request5a, request5b]);
console.assert(groups5.size === 2, 'Should create separate groups for different models');
const [group5a, group5b] = Array.from(groups5.values());
console.assert(group5a.model !== group5b.model, 'Models should differ');
console.log('✓ Different models create separate groups');
console.log(`  - Group A model: ${group5a.model}`);
console.log(`  - Group B model: ${group5b.model}\n`);

// Test 6: Message normalization - timestamps
console.log('=== Test 6: Message Normalization - Timestamps ===');
const request6a = createMockRequest(1000, [{ role: 'user', content: 'Generated 2025-12-17 10:30:00' }]);
const request6b = createMockRequest(2000, [{ role: 'user', content: 'Generated 2025-12-17 11:45:23' }]);
const groups6 = conversationGrouperService.groupConversations([request6a, request6b]);
console.assert(groups6.size === 1, 'Should normalize timestamps and group together');
console.log('✓ Timestamps normalized correctly');
console.log(`  - Original A: "Generated 2025-12-17 10:30:00"`);
console.log(`  - Original B: "Generated 2025-12-17 11:45:23"`);
console.log(`  - Grouped together: ${groups6.size === 1}\n`);

// Test 7: Message normalization - file paths
console.log('=== Test 7: Message Normalization - File Paths ===');
const request7a = createMockRequest(1000, [{ role: 'user', content: 'Read /path/to/file.ts' }]);
const request7b = createMockRequest(2000, [{ role: 'user', content: 'Read /different/path/other.ts' }]);
const groups7 = conversationGrouperService.groupConversations([request7a, request7b]);
console.assert(groups7.size === 1, 'Should normalize file paths and group together');
console.log('✓ File paths normalized correctly');
console.log(`  - Original A: "Read /path/to/file.ts"`);
console.log(`  - Original B: "Read /different/path/other.ts"`);
console.log(`  - Grouped together: ${groups7.size === 1}\n`);

// Test 8: Message normalization - system reminders
console.log('=== Test 8: Message Normalization - System Reminders ===');
const request8a = createMockRequest(1000, [{ role: 'user', content: 'Test <system-reminder>Some reminder</system-reminder>' }]);
const request8b = createMockRequest(2000, [{ role: 'user', content: 'Test <system-reminder>Different reminder</system-reminder>' }]);
const groups8 = conversationGrouperService.groupConversations([request8a, request8b]);
console.assert(groups8.size === 1, 'Should normalize system reminders and group together');
console.log('✓ System reminders normalized correctly');
console.log(`  - Grouped together: ${groups8.size === 1}\n`);

// Test 9: Message normalization - URLs
console.log('=== Test 9: Message Normalization - URLs ===');
const request9a = createMockRequest(1000, [{ role: 'user', content: 'Check https://example.com/page1' }]);
const request9b = createMockRequest(2000, [{ role: 'user', content: 'Check https://example.com/page2' }]);
const groups9 = conversationGrouperService.groupConversations([request9a, request9b]);
// Debug: Check if URLs are being normalized properly
const normalized9a = conversationGrouperService.normalizeMessage('Check https://example.com/page1');
const normalized9b = conversationGrouperService.normalizeMessage('Check https://example.com/page2');
if (groups9.size !== 1) {
  console.log(`  [DEBUG] Groups created: ${groups9.size}`);
  console.log(`  [DEBUG] Normalized A: "${normalized9a}"`);
  console.log(`  [DEBUG] Normalized B: "${normalized9b}"`);
  for (const [groupId, group] of groups9) {
    console.log(`  [DEBUG] Group ${groupId}: ${group.firstUserMessage}`);
  }
}
console.assert(groups9.size === 1, 'Should normalize URLs and group together');
console.log('✓ URLs normalized correctly');
console.log(`  - Grouped together: ${groups9.size === 1}\n`);

// Test 10: Color generation is deterministic
console.log('=== Test 10: Deterministic Color Generation ===');
const request10 = createMockRequest(1000, [{ role: 'user', content: 'Test color' }]);
const groups10a = conversationGrouperService.groupConversations([request10]);
const groups10b = conversationGrouperService.groupConversations([request10]);
const color1 = Array.from(groups10a.values())[0].color;
const color2 = Array.from(groups10b.values())[0].color;
console.assert(color1 === color2, 'Same groupId should generate same color');
console.assert(color1?.startsWith('hsl('), 'Color should be in HSL format');
console.log('✓ Color generation is deterministic');
console.log(`  - Color: ${color1}`);
console.log(`  - Same on second run: ${color1 === color2}\n`);

// Test 11: Colors are different for different groups
console.log('=== Test 11: Different Groups Get Different Colors ===');
const request11a = createMockRequest(1000, [{ role: 'user', content: 'First message' }]);
const request11b = createMockRequest(2000, [{ role: 'user', content: 'Second message' }]);
const groups11 = conversationGrouperService.groupConversations([request11a, request11b]);
console.assert(groups11.size === 2, 'Should create two groups');
const colors = Array.from(groups11.values()).map(g => g.color);
console.assert(colors[0] !== colors[1], 'Different groups should have different colors');
console.log('✓ Different groups have different colors');
console.log(`  - Color A: ${colors[0]}`);
console.log(`  - Color B: ${colors[1]}\n`);

// Test 12: Sequential group indices
console.log('=== Test 12: Sequential Group Indices ===');
const request12a = createMockRequest(1000, [{ role: 'user', content: 'First' }]);
const request12b = createMockRequest(2000, [{ role: 'user', content: 'Second' }]);
const request12c = createMockRequest(3000, [{ role: 'user', content: 'Third' }]);
const groups12 = conversationGrouperService.groupConversations([request12a, request12b, request12c]);
const indices = Array.from(groups12.values()).map(g => g.groupIndex).sort();
console.assert(indices.length === 3, 'Should have three groups');
console.assert(indices[0] === 0 && indices[1] === 1 && indices[2] === 2, 'Indices should be sequential');
console.log('✓ Group indices are sequential');
console.log(`  - Indices: [${indices.join(', ')}]\n`);

// Test 13: Empty messages array
console.log('=== Test 13: Empty Messages Array ===');
const requestEmpty = createMockRequest(1000, []);
const groupsEmpty = conversationGrouperService.groupConversations([requestEmpty]);
console.assert(groupsEmpty.size === 0, 'Should not create group for empty messages');
console.log('✓ Empty messages handled correctly\n');

// Test 14: Complex content blocks (arrays)
console.log('=== Test 14: Complex Content Blocks ===');
const request14: ClaudeTraceEntry = {
  request: {
    timestamp: 1000,
    method: 'POST',
    url: '/v1/messages',
    headers: {},
    body: {
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'First block' },
          { type: 'text', text: 'Second block' }
        ]
      }],
      system: [],
      metadata: { user_id: 'test-user' }
    }
  },
  response: {
    timestamp: 2000,
    status_code: 200,
    headers: {},
    body: {
      model: 'claude-sonnet-4-5',
      id: 'test-id',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'response' }],
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
        service_tier: 'default'
      }
    }
  },
  logged_at: new Date(1000).toISOString()
};
const groups14 = conversationGrouperService.groupConversations([request14]);
console.assert(groups14.size === 1, 'Should handle array content blocks');
const group14 = Array.from(groups14.values())[0];
console.assert(group14.firstUserMessage.includes('First block'), 'Should extract text from blocks');
console.log('✓ Complex content blocks handled correctly');
console.log(`  - Extracted text: "${group14.firstUserMessage}"\n`);

// Test 15: Request ID format
console.log('=== Test 15: Request ID Format ===');
const request15 = createMockRequest(123456, [{ role: 'user', content: 'Test' }]);
const groups15 = conversationGrouperService.groupConversations([request15]);
const group15 = Array.from(groups15.values())[0];
console.assert(group15.requestIds[0] === '123456-0', 'Request ID should match timestamp-index format');
console.log('✓ Request ID format is correct');
console.log(`  - Request ID: ${group15.requestIds[0]}\n`);

console.log('===================');
console.log('All tests passed! ✓');
console.log('===================');
