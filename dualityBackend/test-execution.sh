#!/bin/bash

# Code Execution System - Test Script
# This script tests the complete code execution pipeline

echo "🧪 Testing Code Execution System"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5001/api"
TEAM_NAME="CodeNinjas"
TEAM_PASSWORD="team123"

echo "📝 Step 1: Login as team"
echo "------------------------"

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/team/login" \
  -H "Content-Type: application/json" \
  -d "{\"teamName\": \"$TEAM_NAME\", \"password\": \"$TEAM_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

echo "📝 Step 2: Get available questions"
echo "----------------------------------"

# Get questions
QUESTIONS=$(curl -s "$API_URL/questions")
echo "Questions retrieved. Checking for test questions..."

# Get first question ID (you'll need to replace this with actual question ID)
QUESTION_ID=$(echo $QUESTIONS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$QUESTION_ID" ]; then
  echo -e "${YELLOW}⚠️  No questions found. Please create a question first.${NC}"
  echo ""
  echo "To create a test question, run:"
  echo "  npm run seed-fresh"
  exit 1
fi

echo -e "${GREEN}✅ Found question: $QUESTION_ID${NC}"
echo ""

echo "📝 Step 3: Get active round"
echo "--------------------------"

# Get rounds
ROUNDS=$(curl -s "$API_URL/rounds")
ROUND_ID=$(echo $ROUNDS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ROUND_ID" ]; then
  echo -e "${YELLOW}⚠️  No rounds found. Please create a round first.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found round: $ROUND_ID${NC}"
echo ""

echo "📝 Step 4: Test Python submission"
echo "---------------------------------"

PYTHON_CODE='def solve():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())
    
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                print(i, j)
                return
solve()'

SUBMIT_RESPONSE=$(curl -s -X POST "$API_URL/submissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"questionId\": \"$QUESTION_ID\",
    \"roundId\": \"$ROUND_ID\",
    \"code\": $(echo "$PYTHON_CODE" | jq -Rs .),
    \"language\": \"python\"
  }")

SUBMISSION_ID=$(echo $SUBMIT_RESPONSE | grep -o '"submissionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$SUBMISSION_ID" ]; then
  echo -e "${RED}❌ Submission failed!${NC}"
  echo "Response: $SUBMIT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Submission created: $SUBMISSION_ID${NC}"
echo ""

echo "📝 Step 5: Wait for execution and check results"
echo "-----------------------------------------------"

echo "Waiting for code execution (this may take a few seconds)..."
sleep 5

# Get submission results
RESULT=$(curl -s "$API_URL/submissions/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo $RESULT | grep -o '"status":"[^"]*' | cut -d'"' -f4)
PASSED=$(echo $RESULT | grep -o '"testCasesPassed":[0-9]*' | cut -d':' -f2)
TOTAL=$(echo $RESULT | grep -o '"totalTestCases":[0-9]*' | cut -d':' -f2)
EXEC_TIME=$(echo $RESULT | grep -o '"executionTime":[0-9]*' | cut -d':' -f2)
MEMORY=$(echo $RESULT | grep -o '"memoryUsed":[0-9]*' | cut -d':' -f2)

echo ""
echo "📊 Results:"
echo "  Status: $STATUS"
echo "  Test Cases: $PASSED/$TOTAL passed"
echo "  Execution Time: ${EXEC_TIME}ms"
echo "  Memory Used: ${MEMORY}KB"
echo ""

if [ "$STATUS" = "accepted" ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
elif [ "$STATUS" = "pending" ]; then
  echo -e "${YELLOW}⏳ Still processing... Check again in a few seconds${NC}"
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Full response:"
  echo "$RESULT" | jq '.'
fi

echo ""
echo "================================="
echo "✅ Test script completed!"
echo ""
echo "Next steps:"
echo "  1. Check the full submission: curl $API_URL/submissions/$SUBMISSION_ID -H \"Authorization: Bearer $TOKEN\" | jq"
echo "  2. View all your submissions: curl $API_URL/submissions/team/YOUR_TEAM_ID -H \"Authorization: Bearer $TOKEN\" | jq"
echo "  3. Check leaderboard: curl $API_URL/submissions/leaderboard/$ROUND_ID | jq"
