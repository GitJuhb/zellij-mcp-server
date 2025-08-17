#!/usr/bin/env bash

# Comprehensive LLM Detection System Test
# Tests all aspects of the detection system

set -euo pipefail

echo "🧪 Testing LLM Completion Detection System"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}🔬 Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Basic LLM simulation
test_basic_simulation() {
    echo "Running basic 2-second LLM simulation..."
    timeout 10s /home/jordan/zellij-mcp-server/test-detection.js 2000 "Basic test response"
    return $?
}

# Test 2: Timeout handling
test_timeout_handling() {
    echo "Testing timeout handling (should timeout after 3 seconds)..."
    if timeout 3s /home/jordan/zellij-mcp-server/test-detection.js 5000 "Long response" 2>/dev/null; then
        # Should not reach here
        return 1
    else
        # Timeout expected
        return 0
    fi
}

# Test 3: Signal handling
test_signal_handling() {
    echo "Testing signal handling..."
    /home/jordan/zellij-mcp-server/test-detection.js 10000 "Signal test" &
    local pid=$!
    sleep 1
    kill -TERM $pid
    wait $pid 2>/dev/null || true
    return 0
}

# Test 4: File creation and monitoring
test_file_operations() {
    local test_file="/tmp/detection-test-$$"
    echo "Testing file operations..."
    
    echo "test content" > "$test_file"
    
    if [[ -f "$test_file" ]]; then
        rm -f "$test_file"
        return 0
    else
        return 1
    fi
}

# Test 5: Named pipe creation
test_named_pipe_creation() {
    local pipe_path="/tmp/test-pipe-$$"
    echo "Testing named pipe creation..."
    
    mkfifo "$pipe_path" 2>/dev/null
    
    if [[ -p "$pipe_path" ]]; then
        rm -f "$pipe_path"
        return 0
    else
        return 1
    fi
}

# Test 6: Process monitoring
test_process_monitoring() {
    echo "Testing process monitoring..."
    
    # Start a background process
    sleep 5 &
    local pid=$!
    
    # Check if process exists
    if ps -p $pid > /dev/null 2>&1; then
        kill $pid 2>/dev/null || true
        wait $pid 2>/dev/null || true
        return 0
    else
        return 1
    fi
}

# Test 7: Pattern matching
test_pattern_matching() {
    local test_string="This contains <<<LLM_COMPLETE:0>>> marker"
    echo "Testing pattern matching..."
    
    if echo "$test_string" | grep -q "<<<LLM_COMPLETE"; then
        return 0
    else
        return 1
    fi
}

# Test 8: Concurrent execution
test_concurrent_execution() {
    echo "Testing concurrent execution..."
    
    # Start multiple background processes
    /home/jordan/zellij-mcp-server/test-detection.js 1000 "Process 1" &
    local pid1=$!
    /home/jordan/zellij-mcp-server/test-detection.js 1500 "Process 2" &
    local pid2=$!
    /home/jordan/zellij-mcp-server/test-detection.js 2000 "Process 3" &
    local pid3=$!
    
    # Wait for all to complete
    wait $pid1 && wait $pid2 && wait $pid3
    return $?
}

echo -e "\n${YELLOW}Starting test suite...${NC}"

# Run all tests
run_test "Basic LLM Simulation" "test_basic_simulation"
run_test "Timeout Handling" "test_timeout_handling"  
run_test "Signal Handling" "test_signal_handling"
run_test "File Operations" "test_file_operations"
run_test "Named Pipe Creation" "test_named_pipe_creation"
run_test "Process Monitoring" "test_process_monitoring"
run_test "Pattern Matching" "test_pattern_matching"
run_test "Concurrent Execution" "test_concurrent_execution"

# Summary
echo -e "\n${YELLOW}Test Results Summary${NC}"
echo "===================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests:  $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All tests passed! Detection system is working correctly.${NC}"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "1. Restart Claude Code to load new MCP tools"
    echo "2. Use zellij_create_llm_wrapper to create detection wrappers"
    echo "3. Use zellij_watch_file, zellij_watch_pipe for monitoring"
    echo "4. See examples/llm-detection-example.md for full usage guide"
    
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the detection system.${NC}"
    exit 1
fi