import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTurkishDate } from "@/hooks/use-turkish-date";

interface DutyTeacher {
  id: number;
  teacher: {
    id: number;
    name: string;
    surname: string;
    fullName: string;
  };
  location: {
    id: number;
    name: string;
  };
  dayOfWeek: number;
  dutyType?: 'full_day' | 'break_time';
  period?: {
    id: number;
    order: number;
    startTime: string;
    endTime: string;
  } | null;
}

const DutyTeachers: React.FC = () => {
  const { formattedDate, turkishDayOfWeek, dayOfWeek } = useTurkishDate();
  
  const { data, isLoading, error } = useQuery<DutyTeacher[]>({
    queryKey: ["/api/enhanced/duties"],
    select: (data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((duty: DutyTeacher) => duty.dayOfWeek === dayOfWeek);
    }
  });

  if (isLoading) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-warning border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
        <div className="text-error">Nöbetçi öğretmen verisi yüklenirken hata oluştu.</div>
      </div>
    );
  }

  // Check if teacher is currently on duty
  const isTeacherOnDuty = (duty: DutyTeacher) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // If no period, teacher is on duty all day
    if (!duty.period) return true;
    
    // Otherwise, check if current time is in period
    return currentTime >= duty.period.startTime && currentTime <= duty.period.endTime;
  };

  return (
    <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Bugünkü Nöbetçiler</h3>
        <div className="text-xs bg-warning text-white px-2 py-1 rounded-full">
          {turkishDayOfWeek}
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[320px]">
        {data && data.length > 0 ? (
          data.map((dutyTeacher: DutyTeacher) => {
            // Nöbet alanına göre farklı renk belirleme
            const locationColors = {
              'Bahçe': { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600' },
              '1. Kat': { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600' },
              '2. Kat': { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600' },
              'Kantin': { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600' },
              'Koridor': { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600' },
              'Giriş': { bg: 'bg-sky-50', icon: 'bg-sky-100 text-sky-600' },
              'Spor Salonu': { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600' },
              'Kütüphane': { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600' }
            };
            
            // Varsayılan veya eşleşen renkleri al
            const colors = locationColors[dutyTeacher.location.name as keyof typeof locationColors] || 
                          { bg: 'bg-warning/5', icon: 'bg-warning/10 text-warning' };
                          
            return (
              <div 
                key={dutyTeacher.id} 
                className={`flex items-center p-3 border-b last:border-b-0 ${colors.bg}`}
              >
                <div className={`w-10 h-10 rounded-full ${colors.icon} flex items-center justify-center`}>
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium">{dutyTeacher.teacher.fullName}</div>
                  <div className="text-sm text-neutral-600 font-medium">
                    {dutyTeacher.location.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {dutyTeacher.dutyType === 'break_time' ? 'Ara Nöbet' : 'Tüm Gün'}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isTeacherOnDuty(dutyTeacher) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {isTeacherOnDuty(dutyTeacher) ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <ClipboardList className="h-8 w-8 mb-2" />
            <p>Bugün nöbetçi öğretmen bulunmamaktadır</p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <Link href="/duty">
          <Button variant="link" className="text-warning text-sm flex items-center p-0 h-auto">
            <span>Nöbet çizelgesini görüntüle</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DutyTeachers;
