#!/bin/bash

CLASSES=("5A" "5B" "5C" "6A" "6B" "6C" "7A" "7B" "7C" "8A" "8B" "8C")

for class in "${CLASSES[@]}"; do
  echo "Adding class: $class"
  curl -s -X POST "http://localhost:5000/api/classes" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"name\":\"$class\"}"
  echo -e "\n"
done
