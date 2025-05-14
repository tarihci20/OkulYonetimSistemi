import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { StatusCard } from '@/components/dashboard/status-card';
import ActiveClasses from '@/components/dashboard/active-classes';
import DutyTeachers from '@/components/dashboard/duty-teachers';
import TeacherSchedule from '@/components/dashboard/teacher-schedule';
import { useQuery } from '@tanstack/react-query';
import { School, ClipboardList, UserX, Clock } from 'lucide-react';
import { useTurkishDate } from '@/hooks/use-turkish-date';

interface Period {
  id: number;
  order: number;
  startTime: string;
  endTime: string;
}

interface DashboardData {
  date: string;
  dayOfWeek: number;
  schedules: Array<{
    id: number;
    dayOfWeek: number;
    periodId: number;
    teacherId: number;
    // other fields...
  }>;
  duties: Array<{
    id: number;
    dayOfWeek: number;
    teacherId: number;
    // other fields...
  }>;
  absences: Array<{
    id: number;
    teacherId: number;
    date: string;
    // other fields...
  }>;
  periods: Period[];
  currentPeriod: Period | null;
}

const DashboardPage: React.FC = () => {
  const { date, formattedDate, formattedTime, turkishDayOfWeek } = useTurkishDate({ updateInterval: 30000 });
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 1-7 (Pazartesi-Pazar)

  // Ders dönemi verilerini çek
  const { data: periodsData } = useQuery<Period[]>({
    queryKey: ['/api/periods']
  });

  // Mevcut zaman bilgisi ve ders dönemi hesaplama
  const currentPeriod = React.useMemo(() => {
    if (!periodsData || !Array.isArray(periodsData)) return null;
    const currentTime = formattedTime;
    
    return periodsData.find((period) => 
      currentTime >= period.startTime && currentTime <= period.endTime
    );
  }, [periodsData, formattedTime]);

  // Dashboard verilerini çek
  const { data: currentDayData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard/current-day']
  });

  // İstatistik kartları için değerleri hesapla
  const stats = React.useMemo(() => {
    if (!currentDayData || typeof currentDayData !== 'object') {
      return {
        activeClasses: 0,
        dutyTeachers: 0,
        absentTeachers: 0,
        missingLessons: 0
      };
    }

    // Bugünün ders programını filtrele
    const schedules = Array.isArray(currentDayData.schedules) ? currentDayData.schedules : [];
    const duties = Array.isArray(currentDayData.duties) ? currentDayData.duties : [];
    const absences = Array.isArray(currentDayData.absences) ? currentDayData.absences : [];
    
    // Aktif sınıfları say
    const activeClassesCount = currentPeriod && schedules.length > 0
      ? schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.periodId === currentPeriod.id).length
      : 0;
    
    // Bugünkü nöbetçileri say
    const dutyTeachersCount = duties.length > 0
      ? duties.filter((d) => d.dayOfWeek === dayOfWeek).length
      : 0;
    
    // Yoklama alan öğretmenleri say
    const absentTeachersCount = absences.length;
    
    // Yoklama alınan dersler (boşta kalan dersler)
    const missingLessonsCount = currentPeriod && schedules.length > 0 && absences.length > 0
      ? schedules.filter((s) => 
          s.dayOfWeek === dayOfWeek && 
          s.periodId === currentPeriod.id && 
          absences.some((a) => a.teacherId === s.teacherId)
        ).length
      : 0;
    
    return {
      activeClasses: activeClassesCount,
      dutyTeachers: dutyTeachersCount,
      absentTeachers: absentTeachersCount,
      missingLessons: missingLessonsCount
    };
  }, [currentDayData, currentPeriod, dayOfWeek]);

  return (
    <DashboardLayout title="Kontrol Paneli">
      {/* Üst Durum Kartları */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            Günlük Durum Özeti
          </h3>
          <div className="flex items-center text-neutral-500 text-sm">
            <Clock className="mr-1.5 h-4 w-4" />
            <span>{formattedDate} {formattedTime}</span>
            {currentPeriod && (
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                {currentPeriod.order}. Ders
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusCard
            icon={<School className="h-5 w-5" />}
            title="Aktif Dersler"
            value={stats.activeClasses}
            description={`${stats.activeClasses} Sınıf, ${stats.activeClasses} Öğretmen`}
            color="primary"
          />
          
          <StatusCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="Nöbetçi Öğretmenler"
            value={stats.dutyTeachers}
            description={stats.dutyTeachers > 0 ? "Aktif nöbet alanları" : "Nöbetçi yok"}
            color="warning"
          />
        </div>
      </div>
      
      {/* Ana İçerik Bölümü - Tüm Sınıflar */}
      <div className="mb-6">
        {/* 1. Sınıflardaki Dersler (Tablo) */}
        <ActiveClasses />
      </div>

      {/* Alt Kısım - Nöbetçiler ve Öğretmen Programı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 2. Bugünkü Nöbetçiler */}
        <DutyTeachers />
        
        {/* 3. Öğretmen Dersleri */}
        <TeacherSchedule />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
