# Code Execution System - Setup Guide

## Overview

This guide explains how to set up and use the Docker-based code execution system for testing submissions.

## Prerequisites

### Install Docker

**macOS:**
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or use Homebrew:
brew install --cask docker
```

After installation, start Docker Desktop from Applications.

## Setup Instructions

### 1. Build the Docker Image

From the `server` directory:

```bash
# Build the code execution image
docker build -t code-executor:latest -f docker/Dockerfile docker/

# Verify the image was created
docker images | grep code-executor
```

### 2. Test the Docker Image

```bash
# Test Python execution
docker run --rm code-executor:latest python3 -c "print('Hello from Python')"

# Test Node.js execution
docker run --rm code-executor:latest node -e "console.log('Hello from Node.js')"

# Test C++ compilation
docker run --rm code-executor:latest g++ --version
```

### 3. Start the Server

The server will automatically use the Docker image when processing submissions:

```bash
npm run dev
```

## API Endpoints

### Submit Code

**POST** `/api/submissions`

```json
{
  "questionId": "question_id_here",
  "roundId": "round_id_here",
  "code": "def solution():\n    return 42",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission received and being evaluated",
  "data": {
    "submissionId": "submission_id",
    "status": "pending"
  }
}
```

### Get Submission Status

**GET** `/api/submissions/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "submission_id",
    "status": "accepted",
    "testCasesPassed": 5,
    "totalTestCases": 5,
    "executionTime": 125,
    "memoryUsed": 2048,
    "points": 100,
    "testResults": [
      {
        "testCase": 1,
        "passed": true,
        "executionTime": 25,
        "memoryUsed": 2048
      }
    ]
  }
}
```

### Get Team Submissions

**GET** `/api/submissions/team/:teamId?roundId=xxx&questionId=xxx`

### Get Leaderboard

**GET** `/api/submissions/leaderboard/:roundId`

## Supported Languages

- **Python** (`.py`) - Python 3.x
- **JavaScript** (`.js`) - Node.js 18.x
- **C++** (`.cpp`) - GCC with C++17
- **C** (`.c`) - GCC
- **Java** (`.java`) - OpenJDK 17

## Security Features

✅ **Network Isolation** - Containers have no network access  
✅ **Resource Limits** - 256MB memory, 1 CPU core max  
✅ **Execution Timeout** - 10 seconds maximum  
✅ **Process Limits** - Maximum 50 processes  
✅ **Non-root User** - Code runs as unprivileged user  
✅ **Auto-cleanup** - Containers are automatically removed

## Submission Status Values

- `pending` - Submission is being evaluated
- `accepted` - All test cases passed
- `wrong_answer` - Some or all test cases failed
- `runtime_error` - Code crashed or had errors
- `time_limit_exceeded` - Execution took too long

## Testing the System

### 1. Create a Test Submission

```bash
curl -X POST http://localhost:5001/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEAM_TOKEN" \
  -d '{
    "questionId": "QUESTION_ID",
    "roundId": "ROUND_ID",
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'
```

### 2. Check Submission Status

```bash
curl http://localhost:5001/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_TEAM_TOKEN"
```

## Troubleshooting

### Docker Not Found

If you get "command not found: docker":
1. Install Docker Desktop
2. Start Docker Desktop application
3. Verify with: `docker --version`

### Container Fails to Start

Check Docker is running:
```bash
docker ps
```

### Permission Denied

Make sure Docker Desktop is running and you have permissions:
```bash
docker run hello-world
```

### Slow Execution

First run may be slow as Docker pulls images. Subsequent runs will be faster.

## Development Notes

- Test cases are defined in the Question model's `examples` field
- Points are awarded proportionally for partial solutions
- Only the first accepted submission per question counts for points
- Execution happens asynchronously to avoid blocking the API
- All executions are logged for debugging

## Next Steps

1. Install Docker Desktop
2. Build the Docker image
3. Test with sample submissions
4. Integrate with frontend code editor
5. Monitor execution logs for issues
