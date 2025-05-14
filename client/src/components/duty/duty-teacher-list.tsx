import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react';

interface DutyTeacherListProps {
  duties: any[];
}

const DutyTeacherList: React.FC<DutyTeacherListProps> = ({ duties }) => {
  // Check if teacher is currently on duty
  const isTeacherOnDuty = (duty: any) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // If no period, teacher is on duty all day
    if (!duty.period) return true;
    
    // Otherwise, check if current time is in period
    return currentTime >= duty.period.startTime && currentTime <= duty.period.endTime;
  };
  
  if (!duties || duties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
        <ClipboardList className="h-12 w-12 mb-2 opacity-50" />
        <p>Bugün nöbetçi öğretmen bulunmamaktadır.</p>
      </div>
    );
  }
  
  // Group duties by location
  const dutiesByLocation = duties.reduce((acc, duty) => {
    const locationId = duty.location.id;
    if (!acc[locationId]) {
      acc[locationId] = {
        location: duty.location,
        duties: []
      };
    }
    acc[locationId].duties.push(duty);
    return acc;
  }, {});
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.values(dutiesByLocation).map((locationGroup: any) => (
        <div key={locationGroup.location.id} className="border rounded-md p-4">
          <h3 className="font-medium text-lg mb-2 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-warning" />
            {locationGroup.location.name}
          </h3>
          <Separator className="my-2" />
          <div className="space-y-3">
            {locationGroup.duties.map((duty: any) => (
              <div key={duty.id} className="flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="bg-warning/10 text-warning">
                    {duty.teacher.name[0]}{duty.teacher.surname[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="font-medium text-sm">{duty.teacher.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {duty.period 
                      ? `${duty.period.order}. Ders (${duty.period.startTime} - ${duty.period.endTime})` 
                      : duty.dutyType === 'break_time' 
                        ? "Ara Nöbet" 
                        : "Tüm Gün Nöbet"}
                  </div>
                </div>
                
                <Badge variant={isTeacherOnDuty(duty) ? "default" : "outline"} className="ml-auto">
                  {isTeacherOnDuty(duty) ? (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      <span>Aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span>Pasif</span>
                    </div>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DutyTeacherList;
