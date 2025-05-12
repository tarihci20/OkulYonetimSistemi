#!/bin/bash

# İlkokul Zil Saatleri
PERIODS=(
  '{"order":1,"startTime":"09:00","endTime":"09:40"}'
  '{"order":2,"startTime":"09:50","endTime":"10:30"}'
  '{"order":3,"startTime":"10:40","endTime":"11:20"}'
  '{"order":4,"startTime":"11:30","endTime":"12:10"}'
  '{"order":5,"startTime":"12:20","endTime":"13:00"}'
  '{"order":6,"startTime":"13:40","endTime":"14:20"}'
  '{"order":7,"startTime":"14:30","endTime":"15:10"}'
  '{"order":8,"startTime":"15:20","endTime":"16:00"}'
)

for period_json in "${PERIODS[@]}"; do
  echo "Adding period: $period_json"
  curl -s -X POST "http://localhost:5000/api/periods" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "$period_json"
  echo -e "\n"
done
