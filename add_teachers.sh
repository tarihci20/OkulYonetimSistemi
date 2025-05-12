#!/bin/bash

TEACHERS=(
  "ARİF MÜCAHİT SÖKEL"
  "BEKİR KAYABAŞI"
  "ENES YETİŞEK"
  "ELVAN SEMERCİ"
  "KEVSER ÖĞMEN"
  "BAŞAK MADRAN"
  "GÜLTEN MANİSA"
  "HİLMİ KARADEMİR"
  "HÜSEYİN BERKEZ"
  "MUHAMMET TACEDDİN YÜNLÜ"
  "EMİNE YILDIZ"
  "NERİMAN ÖNER"
  "NURŞEN ŞİMŞEK ÖZEN"
  "SAFİYE KALKAN"
  "SERHAN ÖZYILMAZ"
  "ŞERİFENUR AKTAŞ"
  "VELİ YILDIRIM"
  "HASAN HÜSEYİN ÖZEN"
  "HURİYENUR AY"
  "MERVE ŞİMŞEK"
  "ÖZGE AKYÜZ"
  "ZÜLFE YATKIN"
  "HÜSEYİN ARSLAN"
)

BRANCHES=(
  "Matematik"
  "Türkçe"
  "Fen Bilimleri"
  "Sosyal Bilgiler"
  "İngilizce"
  "Din Kültürü"
  "Beden Eğitimi"
  "Görsel Sanatlar"
  "Müzik"
  "Bilişim Teknolojileri"
  "Matematik"
  "Türkçe"
  "Fen Bilimleri"
  "Sosyal Bilgiler"
  "İngilizce"
  "Din Kültürü"
  "Beden Eğitimi"
  "Türkçe"
  "Matematik"
  "Fen Bilimleri"
  "Sosyal Bilgiler"
  "İngilizce"
  "Bilişim Teknolojileri"
)

for i in "${!TEACHERS[@]}"; do
  FULL_NAME="${TEACHERS[$i]}"
  BRANCH="${BRANCHES[$i]}"
  
  # Split full name into name and surname
  read -r name surname <<< "$FULL_NAME"
  
  echo "Adding teacher: $name $surname - $BRANCH"
  curl -s -X POST "http://localhost:5000/api/teachers" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"name\":\"$name\",\"surname\":\"$surname\",\"branch\":\"$BRANCH\",\"fullName\":\"$FULL_NAME\"}"
  echo -e "\n"
done
