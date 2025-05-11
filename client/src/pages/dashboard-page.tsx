import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { StatusCard } from '@/components/dashboard/status-card';
import ActiveClasses from '@/components/dashboard/active-classes';
import DutyTeachers from '@/components/dashboard/duty-teachers';
import AbsentTeachers from '@/components/dashboard/absent-teachers';
import SubstitutionPanel from '@/components/substitution/substitution-panel';
import { useQuery } from '@tanstack/react-query';
import { School, ClipboardList, UserX } from 'lucide-react';
import { useTurkishDate } from '@/hooks/use-turkish-date';

const DashboardPage: React.FC = () => {
  const { formattedDate, formattedTime } = useTurkishDate({ updateInterval: 30000 });

  // Current period data
  const { data: currentDayData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/current-day']
  });

  // Get current period details if any
  const currentPeriod = React.useMemo(() => {
    if (!currentDayData || !currentDayData.currentPeriod) return null;
    return currentDayData.currentPeriod;
  }, [currentDayData]);

  // Calculate stats for status cards
  const stats = React.useMemo(() => {
    if (!currentDayData) {
      return {
        activeClasses: 0,
        dutyTeachers: 0,
        absentTeachers: 0,
        missingLessons: 0
      };
    }

    // Get current day of week and only count current lessons if in a period
    const dayOfWeek = currentDayData.dayOfWeek;
    
    // Count active classes
    const activeClassesCount = currentPeriod
      ? currentDayData.schedules
          .filter((s: any) => s.dayOfWeek === dayOfWeek && s.periodId === currentPeriod.id)
          .length
      : 0;
    
    // Count duty teachers for today
    const dutyTeachersCount = currentDayData.duties
      .filter((d: any) => d.dayOfWeek === dayOfWeek)
      .length;
    
    // Count absent teachers
    const absentTeachersCount = currentDayData.absences.length;
    
    // Count missing lessons due to absences (if in a period)
    const missingLessonsCount = currentPeriod
      ? currentDayData.schedules
          .filter((s: any) => 
            s.dayOfWeek === dayOfWeek && 
            s.periodId === currentPeriod.id && 
            currentDayData.absences.some((a: any) => a.teacherId === s.teacherId)
          )
          .length
      : 0;
    
    return {
      activeClasses: activeClassesCount,
      dutyTeachers: dutyTeachersCount,
      absentTeachers: absentTeachersCount,
      missingLessons: missingLessonsCount
    };
  }, [currentDayData, currentPeriod]);

  return (
    <DashboardLayout title="Kontrol Paneli">
      {/* Current Status Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-medium mb-4 border-b pb-2">
          Mevcut Durum 
          {currentPeriod ? (
            <span className="text-neutral-400 text-sm ml-2">
              {currentPeriod.order}. Ders ({currentPeriod.startTime} - {currentPeriod.endTime})
            </span>
          ) : (
            <span className="text-neutral-400 text-sm ml-2">Ders saati dışında</span>
          )}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <StatusCard
            icon={<UserX className="h-5 w-5" />}
            title="Yoklama Durumu"
            value={stats.absentTeachers}
            description={`${stats.absentTeachers} Öğretmen İzinli, ${stats.missingLessons} Ders Boşta`}
            color="error"
          />
        </div>
      </div>
      
      {/* Current Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ActiveClasses />
        <DutyTeachers />
        <AbsentTeachers />
      </div>
      
      {/* Absent Teacher Management Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-medium mb-4 border-b pb-2">Yoklama Yönetimi</h3>
        <SubstitutionPanel />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
