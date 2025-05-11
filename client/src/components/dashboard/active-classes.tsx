import React from "react";
import { useQuery } from "@tanstack/react-query";
import { School } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTurkishDate } from "@/hooks/use-turkish-date";

interface ActiveClass {
  id: number;
  className: string;
  subject: string;
  teacher: string;
  periodId: number;
}

interface Schedule {
  id: number;
  dayOfWeek: number;
  periodId: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  class: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: number;
    name: string;
    surname: string;
    fullName: string;
  };
  period: {
    id: number;
    order: number;
    startTime: string;
    endTime: string;
  };
}

const ActiveClasses: React.FC = () => {
  // Türkiye saati kullanımı
  const { date, turkishDayOfWeek, formattedTime, formattedDate } = useTurkishDate({ updateInterval: 30000 });
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 1-7 (Pazartesi-Pazar)

  // Ders saatleri ve mevcut ders saati
  const { data: periodsData } = useQuery({
    queryKey: ["/api/periods"],
  });

  // Mevcut ders saati hesaplama
  const currentPeriod = React.useMemo(() => {
    if (!periodsData) return null;
    
    const currentTime = formattedTime;
    return periodsData.find((period: any) => 
      currentTime >= period.startTime && currentTime <= period.endTime
    );
  }, [periodsData, formattedTime]);

  // Tüm sınıf ve dersler için veri çekme
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['/api/enhanced/schedules']
  });

  // Sınıflar için dersler tablosu oluşturma
  const classSchedules = React.useMemo(() => {
    if (!schedulesData || !periodsData || !currentPeriod) return [];

    // Bugünün programını filtrele
    const todaySchedules = schedulesData.filter((schedule: Schedule) => 
      schedule.dayOfWeek === dayOfWeek
    );
    
    // Tüm sınıfları bul
    const allClasses = Array.from(new Set(todaySchedules.map((s: Schedule) => s.class.name)))
      .sort((a, b) => a.localeCompare(b, 'tr'));
    
    // Her sınıf için mevcut ders saatindeki programı oluştur
    return allClasses.map(className => {
      const scheduleForClass = todaySchedules.find((s: Schedule) => 
        s.class.name === className && s.periodId === currentPeriod.id
      );

      if (!scheduleForClass) {
        return {
          className,
          subject: "Ders yok",
          teacher: "",
          id: 0,
          periodId: currentPeriod.id,
          empty: true
        };
      }

      return {
        id: scheduleForClass.id,
        className: scheduleForClass.class.name,
        subject: scheduleForClass.subject.name,
        teacher: scheduleForClass.teacher.fullName,
        periodId: scheduleForClass.periodId,
        empty: false
      };
    });
  }, [schedulesData, periodsData, currentPeriod, dayOfWeek]);

  if (isLoading) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Sınıflardaki Dersler</h3>
        <div className="text-xs bg-primary text-white px-2 py-1 rounded-full">
          {currentPeriod ? `${currentPeriod.order}. Ders (${currentPeriod.startTime} - ${currentPeriod.endTime})` : "Ders saati dışında"}
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[400px]">
        {currentPeriod ? (
          classSchedules.length > 0 ? (
            <div className="grid gap-2">
              {classSchedules.map((classItem: ActiveClass & {empty?: boolean}) => (
                <div 
                  key={`${classItem.className}-${classItem.periodId}`} 
                  className={`flex items-center p-3 rounded-lg ${classItem.empty ? 'bg-gray-50' : 'bg-primary/5 border border-primary/20'}`}
                >
                  <div className="w-14 h-14 rounded-md bg-primary bg-opacity-10 text-primary flex items-center justify-center font-bold">
                    {classItem.className}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className={`font-medium ${classItem.empty ? 'text-gray-400' : ''}`}>{classItem.subject}</div>
                    {!classItem.empty && (
                      <div className="text-sm text-neutral-500">{classItem.teacher}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <School className="h-8 w-8 mb-2" />
              <p>Şu anda aktif ders bulunmamaktadır</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <School className="h-8 w-8 mb-2" />
            <p>Ders saati dışındasınız</p>
            <p className="text-sm mt-1">({formattedTime})</p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <Link href="/schedule">
          <Button variant="link" className="text-primary text-sm flex items-center p-0 h-auto">
            <span>Tüm ders programını görüntüle</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ActiveClasses;
