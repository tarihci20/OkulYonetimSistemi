#!/bin/bash

LOCATIONS=(
  "Bahçe - Ön"
  "Bahçe - Arka"
  "Koridor - 1. Kat"
  "Koridor - 2. Kat"
  "Koridor - 3. Kat"
  "Kantin"
  "Spor Salonu"
  "Merdiven"
  "Okul Girişi"
  "Kütüphane"
)

for location in "${LOCATIONS[@]}"; do
  echo "Adding duty location: $location"
  curl -s -X POST "http://localhost:5000/api/duty-locations" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"name\":\"$location\"}"
  echo -e "\n"
done
