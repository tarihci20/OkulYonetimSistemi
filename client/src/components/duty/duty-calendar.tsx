import React from 'react';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { getTurkishDayName } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from 'lucide-react';

interface DutyProps {
  duties: any[];
}

const DutyCalendar: React.FC<DutyProps> = ({ duties }) => {
  // Fetch all periods for reference
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['/api/periods']
  });
  
  // Group duties by day and location
  const dutyCalendar = React.useMemo(() => {
    if (!duties || !periods) return {};
    
    const calendar: Record<number, Record<number, { teacher: any, period: any | null }[]>> = {};
    
    // Initialize the calendar for all days and locations
    for (let day = 1; day <= 7; day++) {
      calendar[day] = {};
      
      duties.forEach(duty => {
        if (!calendar[day][duty.location.id]) {
          calendar[day][duty.location.id] = [];
        }
      });
    }
    
    // Add duties to the calendar
    duties.forEach(duty => {
      if (!calendar[duty.dayOfWeek][duty.location.id]) {
        calendar[duty.dayOfWeek][duty.location.id] = [];
      }
      
      calendar[duty.dayOfWeek][duty.location.id].push({
        teacher: duty.teacher,
        period: duty.period
      });
    });
    
    return calendar;
  }, [duties, periods]);
  
  // Get unique locations from duties
  const locations = React.useMemo(() => {
    if (!duties) return [];
    
    const uniqueLocations = new Map();
    duties.forEach(duty => {
      if (!uniqueLocations.has(duty.location.id)) {
        uniqueLocations.set(duty.location.id, duty.location);
      }
    });
    
    return Array.from(uniqueLocations.values());
  }, [duties]);
  
  if (periodsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-warning border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-medium p-2 bg-muted"></div>
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <div key={day} className="font-medium p-2 text-center bg-muted">
              {getTurkishDayName(day)}
            </div>
          ))}
        </div>
        
        {locations.map(location => (
          <div key={location.id} className="grid grid-cols-8 gap-2 mb-4">
            <div className="font-medium p-2 bg-warning/5 flex items-center">
              {location.name}
            </div>
            
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="p-2 min-h-[100px] border rounded-md bg-white">
                {dutyCalendar[day] && dutyCalendar[day][location.id] && dutyCalendar[day][location.id].length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {dutyCalendar[day][location.id].map((duty, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center p-1 bg-warning/10 text-warning rounded border border-warning/20 text-xs">
                              <div className="w-5 h-5 rounded-full bg-warning text-white flex items-center justify-center mr-1">
                                <User className="h-3 w-3" />
                              </div>
                              <span className="truncate">{duty.teacher.fullName}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-bold">{duty.teacher.fullName}</p>
                              <p>{duty.teacher.branch}</p>
                              {duty.period ? (
                                <p>{duty.period.order}. Ders ({duty.period.startTime} - {duty.period.endTime})</p>
                              ) : (
                                <p className="font-semibold">Tüm Gün</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    Nöbetçi yok
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DutyCalendar;
