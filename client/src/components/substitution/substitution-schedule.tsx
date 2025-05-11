import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download, Info, X, User } from 'lucide-react';
import { exportToPng } from '@/lib/utils';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { useToast } from '@/hooks/use-toast';

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

interface SubstitutionScheduleProps {
  teacherSchedules: TeacherSchedule[];
  substitutions: {[key: string]: number};
  onRemoveSubstitute: (periodId: string) => void;
  selectedAbsenceId: string;
}

const SubstitutionSchedule: React.FC<SubstitutionScheduleProps> = ({
  teacherSchedules,
  substitutions,
  onRemoveSubstitute,
  selectedAbsenceId
}) => {
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { formattedDate } = useTurkishDate();
  const { toast } = useToast();
  
  // Fetch teacher data for the selected absence
  const { data: absences } = useQuery({
    queryKey: ['/api/absences/date/' + new Date().toISOString()]
  });
  
  // Fetch all teachers for substitutions
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers']
  });
  
  // Get absent teacher details
  const absentTeacher = React.useMemo(() => {
    if (!absences || !selectedAbsenceId) return null;
    
    const absence = absences.find((a: any) => a.id.toString() === selectedAbsenceId);
    return absence ? absence.teacher : null;
  }, [absences, selectedAbsenceId]);
  
  // Get substitute teacher details
  const getSubstituteTeacher = (periodId: string) => {
    if (!teachers || !substitutions[periodId]) return null;
    
    return teachers.find((t: any) => t.id === substitutions[periodId]);
  };
  
  // Count total substituted lessons for display
  const countSubstitutedLessons = Object.keys(substitutions).length;
  
  // Handle PNG export
  const handleExportPng = async () => {
    if (!scheduleRef.current) return;
    
    try {
      const success = await exportToPng(
        scheduleRef.current, 
        `yerine_görevlendirme_${new Date().toISOString().split('T')[0]}.png`
      );
      
      if (success) {
        toast({
          title: "Dışa aktarma başarılı",
          description: "Yerine görevlendirme çizelgesi PNG olarak kaydedildi.",
        });
      } else {
        toast({
          title: "Dışa aktarma hatası",
          description: "Dosya oluşturulurken bir hata oluştu.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Dışa aktarma hatası",
        description: "Dosya oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  // Handle drop for drag-and-drop
  const handleDrop = (e: React.DragEvent, periodId: string) => {
    e.preventDefault();
    const teacherId = parseInt(e.dataTransfer.getData('teacherId'));
    const draggedPeriodId = e.dataTransfer.getData('periodId');
    
    if (draggedPeriodId === periodId && !isNaN(teacherId)) {
      // Only process if the dragged teacher is for this period
      if (teachers?.some((t: any) => t.id === teacherId)) {
        // Add substitution
        onRemoveSubstitute(periodId); // Remove any existing substitution first
        
        // Delay adding the new one to prevent UI glitches
        setTimeout(() => {
          const newSubEvent = { periodId, teacherId };
          const periodIdStr = periodId.toString();
          const newSubstitutions = { ...substitutions, [periodIdStr]: teacherId };
          
          // Call the parent component's method to update substitutions
          onRemoveSubstitute(periodIdStr);
          setTimeout(() => {
            const element = document.getElementById(`droppable-${periodId}`);
            if (element) element.classList.remove('dragover');
          }, 100);
        }, 100);
      }
    }
  };
  
  // Handle dragover for drag-and-drop
  const handleDragOver = (e: React.DragEvent, periodId: string) => {
    e.preventDefault();
    const element = document.getElementById(`droppable-${periodId}`);
    if (element) element.classList.add('dragover');
  };
  
  // Handle dragleave for drag-and-drop
  const handleDragLeave = (e: React.DragEvent, periodId: string) => {
    e.preventDefault();
    const element = document.getElementById(`droppable-${periodId}`);
    if (element) element.classList.remove('dragover');
  };
  
  return (
    <div className="col-span-1">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Yerine Görevlendirme</h4>
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-secondary border border-secondary px-2 py-1 rounded-full flex items-center h-auto"
          onClick={handleExportPng}
        >
          <Download className="h-3 w-3 mr-1" />
          <span>PNG İndir</span>
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden" ref={scheduleRef}>
        <div className="bg-secondary bg-opacity-5 border-b px-3 py-2">
          <div className="font-medium">
            {absentTeacher ? `${absentTeacher.fullName} Yerine Görevlendirme` : 'Yerine Görevlendirme'}
          </div>
          <div className="text-sm text-neutral-500">{formattedDate}</div>
        </div>
        
        <div className="p-3">
          {teacherSchedules.length > 0 ? (
            teacherSchedules.map((schedule) => {
              const periodId = schedule.period.id.toString();
              const substituteTeacher = getSubstituteTeacher(periodId);
              
              return (
                <div
                  key={schedule.id}
                  id={`droppable-${periodId}`}
                  className="mb-3 p-2 border border-dashed border-neutral-300 rounded-md"
                  onDrop={(e) => handleDrop(e, periodId)}
                  onDragOver={(e) => handleDragOver(e, periodId)}
                  onDragLeave={(e) => handleDragLeave(e, periodId)}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">
                      {schedule.period.order}. Ders ({schedule.period.startTime} - {schedule.period.endTime})
                    </div>
                    <div className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                      {schedule.class.name}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 mb-2">{schedule.subject.name}</div>
                  
                  {substituteTeacher ? (
                    <div className="flex items-center p-2 bg-neutral-100 rounded-md">
                      <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">{substituteTeacher.name} {substituteTeacher.surname}</div>
                        <div className="text-xs text-neutral-500">{substituteTeacher.branch}</div>
                      </div>
                      <button
                        className="ml-auto text-error"
                        onClick={() => onRemoveSubstitute(periodId)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-2 text-neutral-400 text-sm">
                      <Info className="mr-1 h-4 w-4" />
                      <span>Öğretmen sürükleyip bırakın</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center p-4 text-neutral-400">
              İzinli öğretmen ve ders seçilmediğinden görevlendirme yapılamıyor.
            </div>
          )}
        </div>
        
        {absentTeacher && teacherSchedules.length > 0 && (
          <div className="border-t p-3 bg-neutral-100">
            <div className="mb-2 text-sm font-medium">Ek Ders Durumu</div>
            
            <div className="flex items-center justify-between text-sm p-1">
              <div>{absentTeacher.fullName}:</div>
              <div className="text-error">-{teacherSchedules.length} Saat</div>
            </div>
            
            {Object.keys(substitutions).map((periodId) => {
              const substituteTeacher = getSubstituteTeacher(periodId);
              if (!substituteTeacher) return null;
              
              return (
                <div key={periodId} className="flex items-center justify-between text-sm p-1">
                  <div>{substituteTeacher.name} {substituteTeacher.surname}:</div>
                  <div className="text-success">+1 Saat</div>
                </div>
              );
            })}
            
            {countSubstitutedLessons === 0 && (
              <div className="text-sm text-neutral-400 p-1">
                Henüz görevlendirme yapılmadı.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubstitutionSchedule;
