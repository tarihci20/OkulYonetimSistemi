#!/bin/bash

# Eski nöbetleri temizleyelim
for i in {1..30}; do
  curl -s -X DELETE "http://localhost:5000/api/duties/$i" -H "Cookie: $(cat cookie.txt)"
done

# Nöbet yerlerini ID'lerini alalım (varsa)
BAHCE_ID=1
KAT1_ID=2
KAT2_ID=3
KANTIN_ID=4

# Resimde gösterilen nöbet çizelgesini ekleyelim

# Pazartesi nöbetleri
echo "Adding Monday duties"
curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":22,\"locationId\":$BAHCE_ID,\"dayOfWeek\":1,\"notes\":\"11:55-12:10 Enes Yetişek\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":10,\"locationId\":$KAT1_ID,\"dayOfWeek\":1,\"notes\":\"11:55-12:10 Başak Madran\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":12,\"locationId\":$KAT2_ID,\"dayOfWeek\":1,\"notes\":\"11:55-12:10 Huriyenur Ay\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":1,\"locationId\":$KANTIN_ID,\"dayOfWeek\":1,\"notes\":\"11:55-12:10 Safiye Kalkan\"}"

# Salı nöbetleri
echo "Adding Tuesday duties"
curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":2,\"locationId\":$BAHCE_ID,\"dayOfWeek\":2,\"notes\":\"11:55-12:10 Neriman Öner\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":13,\"locationId\":$KAT1_ID,\"dayOfWeek\":2,\"notes\":\"11:55-12:10 Başak Madran\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":21,\"locationId\":$KAT2_ID,\"dayOfWeek\":2,\"notes\":\"11:55-12:10 Gülten Manisa\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":10,\"locationId\":$KANTIN_ID,\"dayOfWeek\":2,\"notes\":\"11:55-12:10 A.Mücahit Sökel\"}"

# Çarşamba nöbetleri
echo "Adding Wednesday duties"
curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":3,\"locationId\":$BAHCE_ID,\"dayOfWeek\":3,\"notes\":\"11:55-12:10 Safiye Kalkan\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":1,\"locationId\":$KAT1_ID,\"dayOfWeek\":3,\"notes\":\"11:55-12:10 Kevser Öğmen\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":19,\"locationId\":$KAT2_ID,\"dayOfWeek\":3,\"notes\":\"11:55-12:10 Veli Yıldırım\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":21,\"locationId\":$KANTIN_ID,\"dayOfWeek\":3,\"notes\":\"11:55-12:10 Şerifenur Aktaş\"}"

# Perşembe nöbetleri
echo "Adding Thursday duties"
curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":5,\"locationId\":$BAHCE_ID,\"dayOfWeek\":4,\"notes\":\"11:55-12:10 Safiye Kalkan\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":23,\"locationId\":$KAT1_ID,\"dayOfWeek\":4,\"notes\":\"11:55-12:10 Taceddin Yünlü\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":17,\"locationId\":$KAT2_ID,\"dayOfWeek\":4,\"notes\":\"11:55-12:10 Zülfe Yatkın\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":13,\"locationId\":$KANTIN_ID,\"dayOfWeek\":4,\"notes\":\"11:55-12:10 Bekir Kayabaşı\"}"

# Cuma nöbetleri
echo "Adding Friday duties"
curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":16,\"locationId\":$BAHCE_ID,\"dayOfWeek\":5,\"notes\":\"11:55-12:10 Hüseyin Arslan\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":12,\"locationId\":$KAT1_ID,\"dayOfWeek\":5,\"notes\":\"11:55-12:10 Özge Akyüz\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":7,\"locationId\":$KAT2_ID,\"dayOfWeek\":5,\"notes\":\"11:55-12:10 Safiye Kalkan\"}"

curl -s -X POST "http://localhost:5000/api/duties" -H "Content-Type: application/json" -H "Cookie: $(cat cookie.txt)" \
  -d "{\"teacherId\":17,\"locationId\":$KANTIN_ID,\"dayOfWeek\":5,\"notes\":\"11:55-12:10 Kevser Öğmen\"}"

echo "All duties updated successfully!"
