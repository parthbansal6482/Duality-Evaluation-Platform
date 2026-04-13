#!/bin/bash

# Test the submission endpoint with authentication

echo "🧪 Testing Code Submission Endpoint"
echo "===================================="
echo ""

API_URL="http://localhost:5001/api"

# Step 1: Login as team
echo "1️⃣ Logging in as CodeNinjas..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/team/login" \
  -H "Content-Type: application/json" \
  -d '{"teamName": "CodeNinjas", "password": "team123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Step 2: Get active rounds
echo "2️⃣ Getting active rounds..."
ROUNDS=$(curl -s "$API_URL/rounds/active" \
  -H "Authorization: Bearer $TOKEN")

echo "Rounds response:"
echo "$ROUNDS" | jq '.' 2>/dev/null || echo "$ROUNDS"
echo ""

# Extract round ID
ROUND_ID=$(echo $ROUNDS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ROUND_ID" ]; then
  echo "❌ No active rounds found. Please create and start a round first."
  echo ""
  echo "To create a round:"
  echo "1. Login as admin"
  echo "2. Create a round with questions"
  echo "3. Start the round"
  exit 1
fi

echo "✅ Found active round: $ROUND_ID"
echo ""

# Step 3: Get round questions
echo "3️⃣ Getting questions for round..."
QUESTIONS=$(curl -s "$API_URL/rounds/$ROUND_ID/questions" \
  -H "Authorization: Bearer $TOKEN")

echo "Questions response:"
echo "$QUESTIONS" | jq '.' 2>/dev/null || echo "$QUESTIONS"
echo ""

# Extract question ID
QUESTION_ID=$(echo $QUESTIONS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$QUESTION_ID" ]; then
  echo "❌ No questions found in this round"
  exit 1
fi

echo "✅ Found question: $QUESTION_ID"
echo ""

# Step 4: Submit code
echo "4️⃣ Submitting Python code..."

PYTHON_CODE='n = int(input())
arr = list(map(int, input().split()))
target = int(input())

for i in range(len(arr)):
    for j in range(i + 1, len(arr)):
        if arr[i] + arr[j] == target:
            print(i, j)
            break'

SUBMIT_RESPONSE=$(curl -s -X POST "$API_URL/rounds/$ROUND_ID/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"questionId\": \"$QUESTION_ID\",
    \"code\": $(echo "$PYTHON_CODE" | jq -Rs .),
    \"language\": \"python\"
  }")

echo "Submission response:"
echo "$SUBMIT_RESPONSE" | jq '.' 2>/dev/null || echo "$SUBMIT_RESPONSE"
echo ""

SUBMISSION_ID=$(echo $SUBMIT_RESPONSE | grep -o '"submissionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ Submission failed!"
  exit 1
fi

echo "✅ Submission created: $SUBMISSION_ID"
echo ""

# Step 5: Wait and check results
echo "5️⃣ Waiting for code execution (10 seconds)..."
sleep 10

echo ""
echo "6️⃣ Checking submission results..."
RESULT=$(curl -s "$API_URL/submissions/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
echo ""

STATUS=$(echo $RESULT | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$STATUS" = "accepted" ]; then
  echo "🎉 SUCCESS! Code was accepted!"
elif [ "$STATUS" = "pending" ]; then
  echo "⏳ Still processing... Check again in a few seconds"
else
  echo "❌ Status: $STATUS"
fi

echo ""
echo "===================================="
echo "Test complete!"
