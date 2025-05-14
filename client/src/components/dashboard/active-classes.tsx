import React from "react";
import { useQuery } from "@tanstack/react-query";
import { School } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTurkishDate } from "@/hooks/use-turkish-date";

interface Period {
  id: number;
  order: number;
  startTime: string;
  endTime: string;
}

interface ActiveClass {
  id: number;
  className: string;
  subject: string;
  teacher: string;
  periodId: number;
  empty?: boolean;
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
  const { data: periodsData } = useQuery<Period[]>({
    queryKey: ["/api/periods"],
  });

  // Mevcut ders saati hesaplama
  const currentPeriod = React.useMemo(() => {
    if (!periodsData || !Array.isArray(periodsData)) return null;
    
    // Test için 8. dersi manuel olarak ayarla (gerçek saatte çalışacak şekilde kaldırılabilir)
    // Normalde bu şekilde hesaplanır:
    // const currentTime = formattedTime;
    // return periodsData.find((period) => currentTime >= period.startTime && currentTime <= period.endTime);
    
    // Test için 8. dersi manuel olarak ayarla
    return periodsData.find(p => p.order === 8);
  }, [periodsData]);

  // Tüm sınıf ve dersler için veri çekme
  const { data: schedulesData, isLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/enhanced/schedules']
  });

  // Sınıflar için dersler tablosu oluşturma
  const classSchedules = React.useMemo(() => {
    if (!schedulesData || !Array.isArray(schedulesData) || !periodsData || !currentPeriod) return [];

    // Bugünün programını filtrele
    const todaySchedules = schedulesData.filter((schedule) => 
      schedule.dayOfWeek === dayOfWeek
    );
    
    // Tüm sınıfları bul
    const allClasses = Array.from(
      new Set(todaySchedules.map((s) => s.class.name))
    ).sort((a, b) => a.localeCompare(b, 'tr'));
    
    // Her sınıf için mevcut ders saatindeki programı oluştur
    return allClasses.map(className => {
      const scheduleForClass = todaySchedules.find((s) => 
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
    <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Sınıflardaki Dersler</h3>
        <div className="text-xs bg-primary text-white px-2 py-1 rounded-full">
          {currentPeriod ? `${currentPeriod.order}. Ders (${currentPeriod.startTime} - ${currentPeriod.endTime})` : "Ders saati dışında"}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {currentPeriod ? (
          Array.isArray(classSchedules) && classSchedules.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left">Sınıf</th>
                  <th className="border px-4 py-2 text-left">Ders</th>
                  <th className="border px-4 py-2 text-left">Öğretmen</th>
                </tr>
              </thead>
              <tbody>
                {classSchedules.map((classItem) => (
                  <tr 
                    key={`${classItem.className}-${classItem.periodId}`} 
                    className={classItem.empty ? 'bg-gray-50' : 'hover:bg-primary/5'}
                  >
                    <td className="border px-4 py-2 font-medium">{classItem.className}</td>
                    <td className="border px-4 py-2">{classItem.subject}</td>
                    <td className="border px-4 py-2">{classItem.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
