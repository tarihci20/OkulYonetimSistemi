#!/bin/bash

# Dersler için ID'ler
SUBJECTS=("1" "2" "3" "4" "5" "6" "7" "8" "9")

# 5A sınıfı için Pazartesi günü ders programı oluşturalım
for period in {1..6}; do
  # Her saat için rastgele bir ders ve öğretmen seçelim
  subject_index=$(( (period + 1) % ${#SUBJECTS[@]} ))
  subject_id=${SUBJECTS[$subject_index]}
  teacher_id=$(( (period + 3) % 23 + 1 ))
  
  echo "Creating schedule: Class 1 (5A), Day 1 (Monday), Period $period, Subject $subject_id, Teacher $teacher_id"
  
  curl -s -X POST "http://localhost:5000/api/schedules" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"classId\":1,\"teacherId\":$teacher_id,\"subjectId\":$subject_id,\"periodId\":$period,\"dayOfWeek\":1}"
  echo -e "\n"
done

# 5B sınıfı için Salı günü ders programı oluşturalım
for period in {1..6}; do
  # Her saat için rastgele bir ders ve öğretmen seçelim
  subject_index=$(( (period + 2) % ${#SUBJECTS[@]} ))
  subject_id=${SUBJECTS[$subject_index]}
  teacher_id=$(( (period + 5) % 23 + 1 ))
  
  echo "Creating schedule: Class 2 (5B), Day 2 (Tuesday), Period $period, Subject $subject_id, Teacher $teacher_id"
  
  curl -s -X POST "http://localhost:5000/api/schedules" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"classId\":2,\"teacherId\":$teacher_id,\"subjectId\":$subject_id,\"periodId\":$period,\"dayOfWeek\":2}"
  echo -e "\n"
done

# 6A sınıfı için Çarşamba günü ders programı oluşturalım
for period in {1..6}; do
  # Her saat için rastgele bir ders ve öğretmen seçelim
  subject_index=$(( (period + 3) % ${#SUBJECTS[@]} ))
  subject_id=${SUBJECTS[$subject_index]}
  teacher_id=$(( (period + 7) % 23 + 1 ))
  
  echo "Creating schedule: Class 4 (6A), Day 3 (Wednesday), Period $period, Subject $subject_id, Teacher $teacher_id"
  
  curl -s -X POST "http://localhost:5000/api/schedules" \
    -H "Content-Type: application/json" \
    -H "Cookie: $(cat cookie.txt)" \
    -d "{\"classId\":4,\"teacherId\":$teacher_id,\"subjectId\":$subject_id,\"periodId\":$period,\"dayOfWeek\":3}"
  echo -e "\n"
done
