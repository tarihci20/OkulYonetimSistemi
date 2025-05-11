import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FilterX, User, Pin } from 'lucide-react';

interface Teacher {
  id: number;
  name: string;
  surname: string;
  branch: string;
  fullName: string;
}

interface Schedule {
  id: number;
  teacherId: number;
  periodId: number;
  dayOfWeek: number;
}

interface Duty {
  id: number;
  teacherId: number;
  periodId: number | null;
  dayOfWeek: number;
}

interface AvailableTeachersProps {
  selectedPeriodId: string;
  selectedDate: Date;
  onSelectTeacher: (periodId: string, teacherId: number) => void;
  selectedSubstitutions: {[key: string]: number};
  handleAutoFill: () => void;
}

const AvailableTeachers: React.FC<AvailableTeachersProps> = ({
  selectedPeriodId,
  selectedDate,
  onSelectTeacher,
  selectedSubstitutions,
  handleAutoFill
}) => {
  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers']
  });
  
  // Fetch all schedules for today
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/enhanced/schedules']
  });
  
  // Fetch all duties for today
  const { data: duties, isLoading: dutiesLoading } = useQuery({
    queryKey: ['/api/enhanced/duties']
  });
  
  // Fetch all absences for today
  const { data: absences, isLoading: absencesLoading } = useQuery({
    queryKey: ['/api/absences/date/' + selectedDate.toISOString()]
  });
  
  // Find current period details
  const periodDetails = React.useMemo(() => {
    if (!selectedPeriodId || !schedules) return null;
    
    const scheduleWithPeriod = schedules.find((s: any) => 
      s.period.id.toString() === selectedPeriodId
    );
    
    if (!scheduleWithPeriod) return null;
    
    return {
      id: scheduleWithPeriod.period.id,
      order: scheduleWithPeriod.period.order,
      startTime: scheduleWithPeriod.period.startTime,
      endTime: scheduleWithPeriod.period.endTime,
      className: scheduleWithPeriod.class.name
    };
  }, [selectedPeriodId, schedules]);
  
  // Check if a teacher is available for substitution
  const getTeacherAvailability = (teacherId: number) => {
    if (!selectedPeriodId || !schedules || !duties || !absences) return { available: false };
    
    const periodId = parseInt(selectedPeriodId);
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    
    // Check if teacher is absent today
    const isAbsent = absences.some((absence: any) => 
      absence.teacher.id === teacherId &&
      new Date(absence.startDate) <= selectedDate &&
      new Date(absence.endDate) >= selectedDate
    );
    
    if (isAbsent) return { available: false, reason: 'absent' };
    
    // Check if teacher is already substituting another class during this period
    const isSubstituting = Object.entries(selectedSubstitutions).some(
      ([pid, tid]) => pid !== selectedPeriodId && tid === teacherId
    );
    
    if (isSubstituting) return { available: false, reason: 'substituting' };
    
    // Check if teacher has a class during this period
    const hasClass = schedules.some((schedule: any) => 
      schedule.teacher.id === teacherId &&
      schedule.period.id === periodId &&
      schedule.dayOfWeek === dayOfWeek
    );
    
    if (hasClass) return { available: false, reason: 'class' };
    
    // Check if teacher has duty during this period
    const hasDuty = duties.some((duty: any) => 
      duty.teacher.id === teacherId &&
      (duty.period === null || duty.period.id === periodId) &&
      duty.dayOfWeek === dayOfWeek
    );
    
    if (hasDuty) return { available: false, reason: 'duty' };
    
    // If none of the above, teacher is available
    return { available: true };
  };
  
  // Get available teachers for the selected period
  const availableTeachers = React.useMemo(() => {
    if (!selectedPeriodId || !teachers || teachersLoading || schedulesLoading || dutiesLoading || absencesLoading) {
      return [];
    }
    
    return teachers.map((teacher: Teacher) => {
      const availability = getTeacherAvailability(teacher.id);
      return {
        ...teacher,
        available: availability.available,
        reason: availability.reason
      };
    });
  }, [selectedPeriodId, teachers, schedules, duties, absences, selectedSubstitutions]);
  
  if (!selectedPeriodId) {
    return (
      <div className="col-span-1 flex items-center justify-center h-64 bg-white rounded-lg shadow-sm p-4">
        <div className="text-center text-neutral-400">
          <div className="mb-2">Lütfen sol panelden bir ders saati seçin</div>
          <div className="text-sm">Uygun öğretmenleri görmek için izinli öğretmenin derslerinden birini seçmelisiniz.</div>
        </div>
      </div>
    );
  }
  
  if (teachersLoading || schedulesLoading || dutiesLoading || absencesLoading) {
    return (
      <div className="col-span-1 flex justify-center items-center h-64 bg-white rounded-lg shadow-sm p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="col-span-1">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Uygun Öğretmenler</h4>
        <Button size="sm" variant="outline" className="text-xs text-primary border border-primary px-2 py-1 rounded-full flex items-center h-auto">
          <FilterX className="h-3 w-3 mr-1" />
          <span>Filtrele</span>
        </Button>
      </div>
      
      {periodDetails && (
        <div className="border rounded-md overflow-hidden mb-4">
          <div className="bg-neutral-100 border-b px-3 py-2 flex justify-between items-center">
            <div className="font-medium">{periodDetails.order}. Ders ({periodDetails.startTime} - {periodDetails.endTime})</div>
            <div className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{periodDetails.className}</div>
          </div>
          
          <div className="overflow-y-auto max-h-48">
            {availableTeachers.length > 0 ? (
              availableTeachers
                .sort((a, b) => {
                  // Sort by availability first, then by subject match
                  if (a.available !== b.available) return a.available ? -1 : 1;
                  return 0;
                })
                .map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`flex items-center p-2 border-b ${
                      teacher.available
                        ? 'teacher-available'
                        : teacher.reason === 'duty'
                        ? 'teacher-duty'
                        : 'teacher-busy'
                    }`}
                    draggable={teacher.available}
                    onDragStart={(e) => {
                      if (teacher.available) {
                        e.dataTransfer.setData('teacherId', teacher.id.toString());
                        e.dataTransfer.setData('periodId', selectedPeriodId);
                      }
                    }}
                    onClick={() => {
                      if (teacher.available) {
                        onSelectTeacher(selectedPeriodId, teacher.id);
                      }
                    }}
                    style={{ cursor: teacher.available ? 'pointer' : 'default' }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      teacher.available
                        ? 'bg-success bg-opacity-10 text-success'
                        : teacher.reason === 'duty'
                        ? 'bg-warning bg-opacity-10 text-warning'
                        : 'bg-error bg-opacity-10 text-error'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{teacher.fullName}</div>
                      <div className="text-sm text-neutral-500">{teacher.branch}</div>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        teacher.available
                          ? 'bg-success bg-opacity-10 text-success'
                          : teacher.reason === 'duty'
                          ? 'bg-warning bg-opacity-10 text-warning'
                          : 'bg-error bg-opacity-10 text-error'
                      }`}>
                        {teacher.available
                          ? 'Uygun'
                          : teacher.reason === 'duty'
                          ? 'Nöbetçi'
                          : teacher.reason === 'class'
                          ? 'Meşgul'
                          : teacher.reason === 'absent'
                          ? 'İzinli'
                          : 'Meşgul'}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="flex items-center justify-center p-4 text-neutral-400">
                Bu saatte uygun öğretmen bulunmamaktadır.
              </div>
            )}
          </div>
        </div>
      )}
      
      <Button 
        className="w-full flex items-center justify-center"
        onClick={handleAutoFill}
      >
        <Pin className="mr-1 h-4 w-4" />
        <span>Otomatik Yerleştir</span>
      </Button>
    </div>
  );
};

export default AvailableTeachers;
