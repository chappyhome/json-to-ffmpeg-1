#!/bin/bash

# Example curl commands for testing the Worker API
# Make sure the worker is running first: npm run dev

BASE_URL="http://localhost:8787"

echo "=== Testing /health endpoint ==="
curl -s "$BASE_URL/health" | jq .
echo ""

echo "=== Testing /version endpoint ==="
curl -s "$BASE_URL/version" | jq .
echo ""

echo "=== Testing /build endpoint with simple timeline ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SIMPLE_JSON="$SCRIPT_DIR/../test/fixtures/complex-timeline.json"

if [ -f "$SIMPLE_JSON" ]; then
  curl -s -X POST "$BASE_URL/build" \
    -H "Content-Type: application/json" \
    -d @"$SIMPLE_JSON" | jq .
else
  echo "Error: simple-timeline.json not found"
fi

echo ""
echo "=== All tests completed ==="
