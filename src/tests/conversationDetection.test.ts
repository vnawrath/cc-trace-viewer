/**
 * Manual tests for conversation detection functionality
 * Run with: npm run test:manual or node --loader ts-node/esm src/tests/conversationDetection.test.ts
 */

import { traceParserService } from "../services/traceParser";
import type { ClaudeTraceEntry } from "../types/trace";

// Test helper to create a mock trace entry
function createMockEntry(
  userMessage: string,
  systemPrompt: string | undefined,
  model: string,
  messageCount: number
): ClaudeTraceEntry {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Add the first user message
  messages.push({ role: "user", content: userMessage });

  // Add additional message pairs to reach the desired count
  for (let i = 1; i < messageCount; i++) {
    if (i % 2 === 1) {
      messages.push({ role: "assistant", content: `Response ${i}` });
    } else {
      messages.push({ role: "user", content: `Follow-up ${i}` });
    }
  }

  return {
    request: {
      timestamp: Date.now() / 1000,
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: {},
      body: {
        model,
        max_tokens: 4096,
        messages,
        system: systemPrompt ? [{ type: "text", text: systemPrompt }] : undefined,
        metadata: { user_id: "test-user" },
      },
    },
    response: {
      timestamp: Date.now() / 1000,
      status_code: 200,
      headers: {},
      body: {
        model,
        id: "test-id",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Response" }],
        stop_reason: "end_turn",
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: {
            ephemeral_5m_input_tokens: 0,
            ephemeral_1h_input_tokens: 0,
          },
          service_tier: "default",
        },
      },
    },
    logged_at: new Date().toISOString(),
  };
}

// Test 1: Message normalization
console.log("=== Test 1: Message Normalization ===");
const testMessages = [
  "Generated 2024-12-04 10:30:45",
  "The user opened the file /path/to/file.ts in the IDE.",
  "This is a message with <system-reminder>Some reminder content</system-reminder> included.",
  "Multiple issues: Generated 2024-01-01 12:00:00 and The user opened the file test.js in the IDE.",
];

testMessages.forEach((msg, idx) => {
  const normalized = traceParserService.normalizeMessageForGrouping(msg);
  console.log(`  Input ${idx + 1}: ${msg}`);
  console.log(`  Output ${idx + 1}: ${normalized}`);
  console.log();
});

// Verify replacements
const timestampTest = traceParserService.normalizeMessageForGrouping(testMessages[0]);
console.assert(
  timestampTest.includes("[TIMESTAMP]"),
  "Timestamp should be replaced with [TIMESTAMP]"
);

const fileTest = traceParserService.normalizeMessageForGrouping(testMessages[1]);
console.assert(
  fileTest.includes("file in IDE"),
  "File reference should be normalized"
);

const reminderTest = traceParserService.normalizeMessageForGrouping(testMessages[2]);
console.assert(
  reminderTest.includes("[SYSTEM-REMINDER]"),
  "System reminder should be replaced"
);

console.log("✓ Message normalization tests passed\n");

// Test 2: Conversation grouping with same first message
console.log("=== Test 2: Conversation Grouping (Same First Message) ===");
const entries1 = [
  createMockEntry("Hello, how are you?", "You are helpful", "claude-3-5-sonnet-20241022", 2),
  createMockEntry("Hello, how are you?", "You are helpful", "claude-3-5-sonnet-20241022", 4),
  createMockEntry("Hello, how are you?", "You are helpful", "claude-3-5-sonnet-20241022", 6),
];

const conversations1 = traceParserService.detectConversations(entries1);
console.log(`  Number of conversations detected: ${conversations1.length}`);
console.log(`  Expected: 1 (same first message)`);
console.assert(
  conversations1.length === 1,
  "Should detect 1 conversation for identical first messages"
);

if (conversations1.length > 0) {
  const conv = conversations1[0];
  console.log(`  Total messages in longest: ${conv.totalMessages}`);
  console.log(`  Total requests in conversation: ${conv.requests.length}`);
  console.assert(
    conv.totalMessages === 6,
    "Longest conversation should have 6 messages"
  );
  console.assert(
    conv.requests.length === 3,
    "Should have 3 requests grouped together"
  );
}

console.log("✓ Same first message grouping test passed\n");

// Test 3: Conversation grouping with different first messages
console.log("=== Test 3: Conversation Grouping (Different First Messages) ===");
const entries2 = [
  createMockEntry("Tell me about cats", "You are helpful", "claude-3-5-sonnet-20241022", 2),
  createMockEntry("Tell me about dogs", "You are helpful", "claude-3-5-sonnet-20241022", 4),
  createMockEntry("Tell me about birds", "You are helpful", "claude-3-5-sonnet-20241022", 3),
];

const conversations2 = traceParserService.detectConversations(entries2);
console.log(`  Number of conversations detected: ${conversations2.length}`);
console.log(`  Expected: 3 (different first messages)`);
console.assert(
  conversations2.length === 3,
  "Should detect 3 conversations for different first messages"
);

console.log("✓ Different first message grouping test passed\n");

// Test 4: Message normalization groups similar messages
console.log("=== Test 4: Normalized Grouping (Dynamic Content) ===");
const entries3 = [
  createMockEntry(
    "Generated 2024-12-04 10:30:45. Please help me.",
    "You are helpful",
    "claude-3-5-sonnet-20241022",
    2
  ),
  createMockEntry(
    "Generated 2024-12-05 15:20:10. Please help me.",
    "You are helpful",
    "claude-3-5-sonnet-20241022",
    4
  ),
];

const conversations3 = traceParserService.detectConversations(entries3);
console.log(`  Number of conversations detected: ${conversations3.length}`);
console.log(`  Expected: 1 (timestamps normalized)`);
console.assert(
  conversations3.length === 1,
  "Should detect 1 conversation when timestamps are normalized"
);

console.log("✓ Normalized grouping test passed\n");

// Test 5: Different models = different conversations
console.log("=== Test 5: Model Differentiation ===");
const entries4 = [
  createMockEntry("Same message", "You are helpful", "claude-3-5-sonnet-20241022", 2),
  createMockEntry("Same message", "You are helpful", "claude-3-opus-20240229", 2),
];

const conversations4 = traceParserService.detectConversations(entries4);
console.log(`  Number of conversations detected: ${conversations4.length}`);
console.log(`  Expected: 2 (different models)`);
console.assert(
  conversations4.length === 2,
  "Should detect 2 conversations for different models"
);

console.log("✓ Model differentiation test passed\n");

// Test 6: Conversation metadata extraction
console.log("=== Test 6: Conversation Metadata Extraction ===");
const entries5 = [
  createMockEntry("Short conversation", "You are helpful", "claude-3-5-sonnet-20241022", 2),
  createMockEntry("Medium conversation", "You are helpful", "claude-3-5-sonnet-20241022", 5),
  createMockEntry("Long conversation", "You are helpful", "claude-3-5-sonnet-20241022", 10),
];

const conversations5 = traceParserService.detectConversations(entries5);
const metadata = traceParserService.extractConversationMetadata(conversations5);

console.log(`  Conversation count: ${metadata.conversationCount}`);
console.log(`  Expected: 3`);
console.assert(metadata.conversationCount === 3, "Should count 3 conversations");

console.log(`  Longest conversation message count: ${metadata.longestConversation?.messageCount}`);
console.log(`  Expected: 10`);
console.assert(
  metadata.longestConversation?.messageCount === 10,
  "Should identify conversation with 10 messages as longest"
);

console.log(`  Longest conversation preview: "${metadata.longestConversation?.firstUserMessage}"`);
console.assert(
  metadata.longestConversation?.firstUserMessage.includes("Long conversation"),
  "Preview should include first message of longest conversation"
);

console.log("✓ Metadata extraction test passed\n");

// Test 7: Edge cases
console.log("=== Test 7: Edge Cases ===");

// Empty entries
const emptyConversations = traceParserService.detectConversations([]);
console.assert(
  emptyConversations.length === 0,
  "Empty entries should return empty conversations array"
);
console.log("  ✓ Empty entries handled");

// Entries with no messages
const noMessagesEntry = createMockEntry("Test", "System", "claude-3-5-sonnet-20241022", 1);
noMessagesEntry.request.body.messages = [];
const noMessagesConversations = traceParserService.detectConversations([noMessagesEntry]);
console.assert(
  noMessagesConversations.length === 0,
  "Entries with no messages should be skipped"
);
console.log("  ✓ No messages handled");

// Empty metadata
const emptyMetadata = traceParserService.extractConversationMetadata([]);
console.assert(
  emptyMetadata.conversationCount === 0 && emptyMetadata.longestConversation === null,
  "Empty conversations should return zero metadata"
);
console.log("  ✓ Empty metadata handled");

console.log("✓ Edge case tests passed\n");

// Test 8: Content array with multiple blocks
console.log("=== Test 8: Array Content Normalization ===");
const arrayContent = [
  { type: "text", text: "Generated 2024-12-04 10:30:45" },
  { type: "text", text: " Hello world" },
  { type: "tool_use", name: "test", id: "123" },
];
const normalizedArray = traceParserService.normalizeMessageForGrouping(arrayContent);
console.log(`  Normalized: ${normalizedArray}`);
console.assert(
  normalizedArray.includes("[TIMESTAMP]") && normalizedArray.includes("Hello world"),
  "Should extract and normalize text from content blocks"
);
console.log("✓ Array content normalization test passed\n");

console.log("===================");
console.log("All tests passed! ✓");
console.log("===================");
