#!/bin/bash

# Öğretmen ID'lerini alalım
TEACHER_IDS=$(curl -s -X GET "http://localhost:5000/api/teachers" -H "Cookie: $(cat cookie.txt)" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

# Nöbet yeri ID'lerini alalım
LOCATION_IDS=$(curl -s -X GET "http://localhost:5000/api/duty-locations" -H "Cookie: $(cat cookie.txt)" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

# ID'leri diziye çevirelim
TEACHER_ID_ARRAY=($TEACHER_IDS)
LOCATION_ID_ARRAY=($LOCATION_IDS)

# 5 gün için nöbet oluşturalım (Pazartesi-Cuma)
for day in {1..5}; do
  # Her gün için rastgele 5 öğretmene nöbet verelim (nöbet yeri sayısı kadar)
  for i in {0..4}; do
    # Modüler aritmetik kullanarak öğretmen seç (kaç öğretmen varsa)
    teacher_index=$(( (day + i) % ${#TEACHER_ID_ARRAY[@]} ))
    location_index=$(( i % ${#LOCATION_ID_ARRAY[@]} ))
    
    teacher_id=${TEACHER_ID_ARRAY[$teacher_index]}
    location_id=${LOCATION_ID_ARRAY[$location_index]}
    
    echo "Assing duty: Day $day, Teacher ID: $teacher_id, Location ID: $location_id"
    
    curl -s -X POST "http://localhost:5000/api/duties" \
      -H "Content-Type: application/json" \
      -H "Cookie: $(cat cookie.txt)" \
      -d "{\"teacherId\":$teacher_id,\"locationId\":$location_id,\"dayOfWeek\":$day}"
    echo -e "\n"
  done
done
