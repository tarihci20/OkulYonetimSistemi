#!/bin/bash

# Eski nöbet yerlerini temizleyelim
for i in {1..10}; do
  curl -s -X DELETE "http://localhost:5000/api/duty-locations/$i" -H "Cookie: $(cat cookie.txt)"
done

# Yeni nöbet yerlerini ekleyelim
LOCATIONS=(
  "Bahçe"
  "1. Kat"
  "2. Kat"
  "Kantin"
)

for location in "${LOCATIONS[@]}"; do
  echo "Adding duty location: $location"
  curl -s -X POST "http://localhost:5000/api/duty-locations" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"name\":\"$location\"}"
  echo -e "\n"
done
