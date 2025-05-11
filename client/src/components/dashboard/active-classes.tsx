import React from "react";
import { useQuery } from "@tanstack/react-query";
import { School } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ActiveClass {
  id: number;
  className: string;
  subject: string;
  teacher: string;
}

const ActiveClasses: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/enhanced/schedules"],
    select: (data) => {
      // Get current day of week and find current period
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1-7 where 1 is Monday
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Filter schedules to get only current day and active classes
      return data
        .filter((schedule: any) => schedule.dayOfWeek === dayOfWeek)
        .map((schedule: any) => ({
          id: schedule.id,
          className: schedule.class.name,
          subject: schedule.subject.name,
          teacher: schedule.teacher.fullName,
          period: schedule.period
        }))
        .filter((schedule: any) => 
          currentTime >= schedule.period.startTime && 
          currentTime <= schedule.period.endTime
        )
        .slice(0, 5); // Limit to 5 active classes for display
    }
  });

  const currentPeriod = React.useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Find current period (this would be better coming from API)
    const periods = [
      { order: 1, startTime: "08:30", endTime: "09:10" },
      { order: 2, startTime: "09:20", endTime: "10:00" },
      { order: 3, startTime: "10:10", endTime: "10:50" },
      { order: 4, startTime: "11:20", endTime: "12:00" },
      { order: 5, startTime: "12:10", endTime: "12:50" },
      { order: 6, startTime: "13:40", endTime: "14:20" },
      { order: 7, startTime: "14:30", endTime: "15:10" },
      { order: 8, startTime: "15:20", endTime: "16:00" }
    ];
    
    const current = periods.find(period => 
      currentTime >= period.startTime && currentTime <= period.endTime
    );
    
    return current?.order || null;
  }, []);

  if (isLoading) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
        <div className="text-error">Veri yüklenirken hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Aktif Dersler</h3>
        <div className="text-xs bg-primary text-white px-2 py-1 rounded-full">
          {currentPeriod ? `${currentPeriod}. Ders` : "Ders saati dışında"}
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-64">
        {data && data.length > 0 ? (
          data.map((classItem: ActiveClass) => (
            <div key={classItem.id} className="flex items-center p-2 border-b">
              <div className="w-12 h-12 rounded-md bg-primary bg-opacity-10 text-primary flex items-center justify-center font-bold">
                {classItem.className}
              </div>
              <div className="ml-3">
                <div className="font-medium">{classItem.subject}</div>
                <div className="text-sm text-neutral-500">{classItem.teacher}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <School className="h-8 w-8 mb-2" />
            <p>Şu anda aktif ders bulunmamaktadır</p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <Link href="/schedule">
          <Button variant="link" className="text-primary text-sm flex items-center p-0 h-auto">
            <span>Tüm dersleri görüntüle</span>
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
