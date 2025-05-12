#!/bin/bash

# Öğretmenler için 23 ID varsayalım
TEACHER_COUNT=23
# Lokasyonlar için 10 ID varsayalım
LOCATION_COUNT=10

# 5 gün için nöbet oluşturalım (Pazartesi-Cuma)
for day in {1..5}; do
  # Her gün için 5 öğretmene nöbet verelim (nöbet yeri sayısı kadar)
  for i in {0..4}; do
    # Modüler aritmetik kullanarak öğretmen seç
    teacher_id=$(( (day + i) % TEACHER_COUNT + 1 ))
    location_id=$(( i % LOCATION_COUNT + 1 ))
    
    echo "Assing duty: Day $day, Teacher ID: $teacher_id, Location ID: $location_id"
    
    curl -s -X POST "http://localhost:5000/api/duties" \
      -H "Content-Type: application/json" \
      -H "Cookie: $(cat cookie.txt)" \
      -d "{\"teacherId\":$teacher_id,\"locationId\":$location_id,\"dayOfWeek\":$day}"
    echo -e "\n"
  done
done
