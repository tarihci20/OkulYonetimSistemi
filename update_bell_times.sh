#!/bin/bash

# Eski zil saatlerini temizleyelim
curl -s -X DELETE "http://localhost:5000/api/periods/1" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/2" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/3" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/4" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/5" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/6" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/7" -H "Cookie: $(cat cookie.txt)"
curl -s -X DELETE "http://localhost:5000/api/periods/8" -H "Cookie: $(cat cookie.txt)"

# Resimde gösterilen zil saatlerini ekleyelim
PERIODS=(
  '{"order":1,"startTime":"08:55","endTime":"09:35"}'
  '{"order":2,"startTime":"09:50","endTime":"10:25"}'
  '{"order":3,"startTime":"10:35","endTime":"11:10"}'
  '{"order":4,"startTime":"11:20","endTime":"11:55"}'
  '{"order":5,"startTime":"12:45","endTime":"13:20"}'
  '{"order":6,"startTime":"13:35","endTime":"14:10"}'
  '{"order":7,"startTime":"14:25","endTime":"15:00"}'
  '{"order":8,"startTime":"15:15","endTime":"15:50"}'
  '{"order":9,"startTime":"16:00","endTime":"16:30"}'
  '{"order":10,"startTime":"16:40","endTime":"17:10"}'
)

for period_json in "${PERIODS[@]}"; do
  echo "Adding period: $period_json"
  curl -s -X POST "http://localhost:5000/api/periods" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "$period_json"
  echo -e "\n"
done
