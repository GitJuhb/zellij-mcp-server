#!/usr/bin/env node

// Simple test script to verify LLM detection system works
// This simulates an LLM that takes some time to complete

const args = process.argv.slice(2);
const delay = parseInt(args[0]) || 3000; // Default 3 second delay
const message = args[1] || "Hello, this is a simulated LLM response!";

console.log("🤖 Starting simulated LLM query...");
console.log(`📝 Input: ${args.join(' ')}`);
console.log("⏳ Processing...");

// Simulate LLM processing time
setTimeout(() => {
  console.log("✅ LLM Response:", message);
  console.log("📊 Processing complete!");
  console.log("<<<LLM_COMPLETE:0>>>");
  process.exit(0);
}, delay);

// Handle interruption
process.on('SIGINT', () => {
  console.log("\n❌ LLM query interrupted");
  console.log("<<<LLM_COMPLETE:130>>>");
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log("\n⏹️  LLM query terminated");
  console.log("<<<LLM_COMPLETE:143>>>");
  process.exit(143);
});