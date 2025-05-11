import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AvailableTeachers from './available-teachers';
import SubstitutionSchedule from './substitution-schedule';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TeacherAbsence {
  id: number;
  teacher: {
    id: number;
    name: string;
    surname: string;
    branch: string;
    fullName: string;
  };
  reason: string;
  startDate: string;
  endDate: string;
}

interface TeacherSchedule {
  id: number;
  teacher: {
    id: number;
    name: string;
    surname: string;
    branch: string;
    fullName: string;
  };
  class: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
  };
  period: {
    id: number;
    order: number;
    startTime: string;
    endTime: string;
  };
  dayOfWeek: number;
}

const SubstitutionPanel = () => {
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<string>('');
  const [selectedTeacherSchedules, setSelectedTeacherSchedules] = useState<TeacherSchedule[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [substitutions, setSubstitutions] = useState<{[key: string]: number}>({});
  
  // Fetch absences for today
  const { data: absences, isLoading: absencesLoading, error: absencesError } = useQuery({
    queryKey: ['/api/absences/date/' + new Date().toISOString()]
  });
  
  // Fetch all schedules
  const { data: allSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/enhanced/schedules']
  });
  
  // When an absence is selected, fetch the teacher's schedule for today
  useEffect(() => {
    if (selectedAbsenceId && absences && allSchedules) {
      const absenceData = absences.find((a: TeacherAbsence) => a.id.toString() === selectedAbsenceId);
      if (absenceData) {
        const teacherId = absenceData.teacher.id;
        const currentDate = new Date();
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
        
        // Filter all schedules to get selected teacher's schedule for today
        const teacherSchedules = allSchedules.filter((schedule: TeacherSchedule) => 
          schedule.teacher.id === teacherId && schedule.dayOfWeek === dayOfWeek
        );
        
        setSelectedTeacherSchedules(teacherSchedules);
        
        // Reset selected period
        setSelectedPeriodId('');
        
        // Reset substitutions
        setSubstitutions({});
      }
    } else {
      setSelectedTeacherSchedules([]);
    }
  }, [selectedAbsenceId, absences, allSchedules]);
  
  // Handle assigning a substitute teacher to a period
  const handleAssignSubstitute = (periodId: string, substituteTeacherId: number) => {
    setSubstitutions(prev => ({
      ...prev,
      [periodId]: substituteTeacherId
    }));
  };
  
  // Handle removing a substitute teacher assignment
  const handleRemoveSubstitute = (periodId: string) => {
    setSubstitutions(prev => {
      const newSubstitutions = { ...prev };
      delete newSubstitutions[periodId];
      return newSubstitutions;
    });
  };
  
  // Auto-fill function to automatically assign available teachers
  const handleAutoFill = () => {
    // This would need to be implemented based on teacher availability
    // For now, this is just a placeholder
    alert('Bu özellik henüz geliştirilme aşamasındadır.');
  };
  
  if (absencesLoading || schedulesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (absencesError) {
    return (
      <div className="p-4 text-error">
        İzinli öğretmen verileri yüklenirken bir hata oluştu.
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Absent Teacher Selection */}
      <div className="col-span-1">
        <div className="mb-4">
          <Label htmlFor="absent-teacher">İzinli Öğretmen</Label>
          <Select
            value={selectedAbsenceId}
            onValueChange={setSelectedAbsenceId}
          >
            <SelectTrigger id="absent-teacher" className="w-full">
              <SelectValue placeholder="Öğretmen Seçin" />
            </SelectTrigger>
            <SelectContent>
              {absences && absences.length > 0 ? (
                absences.map((absence: TeacherAbsence) => (
                  <SelectItem key={absence.id} value={absence.id.toString()}>
                    {absence.teacher.fullName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>İzinli öğretmen bulunmamaktadır</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {selectedAbsenceId && absences && (
          <div className="mb-4">
            <div className="p-3 bg-neutral-100 rounded-md">
              {(() => {
                const absenceData = absences.find((a: TeacherAbsence) => a.id.toString() === selectedAbsenceId);
                return absenceData ? (
                  <>
                    <div className="font-medium">{absenceData.teacher.fullName}</div>
                    <div className="text-sm text-neutral-500">{absenceData.teacher.branch}</div>
                    <div className="text-sm text-neutral-500 mt-1">İzin Türü: {absenceData.reason || 'Belirtilmemiş'}</div>
                    <div className="text-sm text-neutral-500">
                      İzin Süresi: {new Date(absenceData.startDate).toLocaleDateString('tr-TR')} - {new Date(absenceData.endDate).toLocaleDateString('tr-TR')}
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        )}
        
        {selectedTeacherSchedules.length > 0 && (
          <div className="border rounded-md p-3">
            <div className="font-medium mb-2">Bugünkü Dersleri</div>
            
            {selectedTeacherSchedules.map((schedule) => (
              <div 
                key={schedule.id} 
                className="mb-2 p-2 border-l-4 border-primary bg-primary bg-opacity-5 rounded-r-md"
                onClick={() => setSelectedPeriodId(schedule.period.id.toString())}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex justify-between">
                  <div className="font-medium">
                    {schedule.period.order}. Ders ({schedule.period.startTime} - {schedule.period.endTime})
                  </div>
                  <div className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                    {schedule.class.name}
                  </div>
                </div>
                <div className="text-sm text-neutral-500">{schedule.subject.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Available Teachers */}
      <AvailableTeachers 
        selectedPeriodId={selectedPeriodId}
        selectedDate={new Date()}
        onSelectTeacher={handleAssignSubstitute}
        selectedSubstitutions={substitutions}
        handleAutoFill={handleAutoFill}
      />
      
      {/* Substitution Schedule */}
      <SubstitutionSchedule 
        teacherSchedules={selectedTeacherSchedules}
        substitutions={substitutions}
        onRemoveSubstitute={handleRemoveSubstitute}
        selectedAbsenceId={selectedAbsenceId}
      />
    </div>
  );
};

export default SubstitutionPanel;
