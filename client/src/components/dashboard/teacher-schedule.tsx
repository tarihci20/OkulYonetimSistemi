import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserRound, Calendar, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTurkishDate } from "@/hooks/use-turkish-date";

interface Teacher {
  id: number;
  name: string;
  surname: string;
  fullName: string;
  branch: string;
}

interface TeacherSchedule {
  id: number;
  periodId: number;
  periodOrder: number;
  periodTime: string;
  className: string;
  subject: string;
}

const TeacherSchedule: React.FC = () => {
  // Türkiye saati kullanımı
  const { date, turkishDayOfWeek, formattedTime } = useTurkishDate({ updateInterval: 30000 });
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 1-7 (Pazartesi-Pazar)
  
  // Durum değişkenleri
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Öğretmenleri çek
  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["/api/teachers"]
  });

  // Ders saatleri çek
  const { data: periodsData } = useQuery({
    queryKey: ["/api/periods"]
  });

  // Mevcut ders saati hesaplama
  const currentPeriod = useMemo(() => {
    if (!periodsData) return null;
    
    const currentTime = formattedTime;
    return periodsData.find((period: any) => 
      currentTime >= period.startTime && currentTime <= period.endTime
    );
  }, [periodsData, formattedTime]);

  // Program verilerini çek
  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["/api/enhanced/schedules"]
  });

  // Öğretmen filtresi
  const filteredTeachers = useMemo(() => {
    if (!teachersData) return [];
    
    return teachersData.filter((teacher: Teacher) => 
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.branch.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachersData, searchTerm]);

  // Seçilen öğretmenin programı
  const teacherSchedules = useMemo(() => {
    if (!schedulesData || !periodsData || !selectedTeacherId) return [];

    // Bugünün programını filtrele
    const todaySchedules = schedulesData.filter((schedule: any) => 
      schedule.teacherId === selectedTeacherId && 
      schedule.dayOfWeek === dayOfWeek
    );
    
    // Ders saatleri sırasına göre düzenle
    return todaySchedules
      .map((schedule: any) => ({
        id: schedule.id,
        periodId: schedule.periodId,
        periodOrder: schedule.period.order,
        periodTime: `${schedule.period.startTime} - ${schedule.period.endTime}`,
        className: schedule.class.name,
        subject: schedule.subject.name,
      }))
      .sort((a: TeacherSchedule, b: TeacherSchedule) => a.periodOrder - b.periodOrder);
  }, [schedulesData, periodsData, selectedTeacherId, dayOfWeek]);

  // Loading durumu
  if (isLoadingTeachers || isLoadingSchedules) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Öğretmen Programı</h3>
        <div className="text-xs bg-primary text-white px-2 py-1 rounded-full">
          {turkishDayOfWeek}
        </div>
      </div>
      
      {/* Öğretmen arama ve seçim */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Öğretmen adı veya branşı ara..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {teachersData && teachersData.length > 0 && (
          <Select 
            value={selectedTeacherId?.toString() || ""} 
            onValueChange={(value) => setSelectedTeacherId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Öğretmen seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {filteredTeachers.map((teacher: Teacher) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.fullName} - {teacher.branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Öğretmen programı */}
      <div className="overflow-y-auto max-h-[300px]">
        {selectedTeacherId ? (
          teacherSchedules.length > 0 ? (
            <div className="space-y-2">
              {teacherSchedules.map((schedule: TeacherSchedule) => (
                <div 
                  key={schedule.id} 
                  className={`p-3 rounded-lg border ${
                    currentPeriod && currentPeriod.id === schedule.periodId
                      ? 'bg-primary/10 border-primary/30 font-medium'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium text-sm">
                      {schedule.periodOrder}. Ders
                    </div>
                    <div className="text-xs text-gray-500">
                      {schedule.periodTime}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="w-10 h-10 rounded bg-primary bg-opacity-10 text-primary flex items-center justify-center font-bold text-sm">
                      {schedule.className}
                    </div>
                    <div className="ml-2">
                      {schedule.subject}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <Calendar className="h-8 w-8 mb-2" />
              <p>Bugün için ders programı bulunamadı</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <UserRound className="h-8 w-8 mb-2" />
            <p>Lütfen bir öğretmen seçiniz</p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <Link href="/schedule">
          <Button variant="link" className="text-primary text-sm flex items-center p-0 h-auto">
            <span>Tüm öğretmen programlarını görüntüle</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TeacherSchedule;