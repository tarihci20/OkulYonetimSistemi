import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, PlusCircle, Printer } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTurkishMonthName } from '@/lib/utils';

interface ExtraLessonTableProps {
  month: number;
  year: number;
}

interface ExtraLesson {
  id: number;
  teacher: {
    id: number;
    name: string;
    surname: string;
    branch: string;
    fullName: string;
  };
  count: number;
  month: number;
  year: number;
  type: string;
  notes?: string;
}

interface TeacherSummary {
  id: number;
  name: string;
  surname: string;
  branch: string;
  normalLessons: number;
  extraLessons: number;
  missingLessons: number;
  total: number;
}

const ExtraLessonTable: React.FC<ExtraLessonTableProps> = ({ month, year }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [lessonCount, setLessonCount] = useState<string>('1');
  const [lessonType, setLessonType] = useState<string>('manual');
  const [notes, setNotes] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch extra lessons for the selected month and year
  const { data: extraLessons, isLoading: extraLessonsLoading } = useQuery({
    queryKey: [`/api/extra-lessons/month/${month}/year/${year}`]
  });
  
  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers']
  });
  
  // Calculate summary for each teacher
  const teacherSummaries = React.useMemo(() => {
    if (!extraLessons || !teachers) return [];
    
    const summaries: TeacherSummary[] = teachers.map((teacher: any) => {
      // Get all extra lessons for this teacher
      const teacherLessons = extraLessons.filter((lesson: ExtraLesson) => 
        lesson.teacher.id === teacher.id
      );
      
      // Calculate total extra and missing lessons
      let extraLessonsCount = 0;
      let missingLessonsCount = 0;
      
      teacherLessons.forEach((lesson: ExtraLesson) => {
        if (lesson.count > 0) {
          extraLessonsCount += lesson.count;
        } else {
          missingLessonsCount += Math.abs(lesson.count);
        }
      });
      
      // Normal lessons is assumed to be 15 for all teachers
      const normalLessons = 15;
      
      return {
        id: teacher.id,
        name: teacher.name,
        surname: teacher.surname,
        branch: teacher.branch,
        normalLessons,
        extraLessons: extraLessonsCount,
        missingLessons: missingLessonsCount,
        total: normalLessons + extraLessonsCount - missingLessonsCount
      };
    });
    
    return summaries;
  }, [extraLessons, teachers]);
  
  // Handle adding new extra lesson
  const handleAddExtraLesson = async () => {
    if (!selectedTeacherId || !lessonCount) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen öğretmen ve ders sayısı seçin.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/extra-lessons", {
        teacherId: parseInt(selectedTeacherId),
        count: parseInt(lessonCount),
        month,
        year,
        type: lessonType,
        notes: notes || `Manuel eklendi: ${new Date().toLocaleDateString('tr-TR')}`
      });
      
      // Invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/extra-lessons/month/${month}/year/${year}`] });
      
      // Close dialog and reset form
      setIsAddDialogOpen(false);
      setSelectedTeacherId('');
      setLessonCount('1');
      setLessonType('manual');
      setNotes('');
      
      toast({
        title: "Ek ders eklendi",
        description: "Ek ders kaydı başarıyla oluşturuldu.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ek ders eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  if (extraLessonsLoading || teachersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-x-auto">
        <Table className="min-w-full bg-white">
          <TableHeader className="bg-neutral-100 text-neutral-600 text-left text-sm">
            <TableRow>
              <TableHead className="py-3 px-4 font-medium">Öğretmen</TableHead>
              <TableHead className="py-3 px-4 font-medium">Branş</TableHead>
              <TableHead className="py-3 px-4 font-medium">Normal Ders</TableHead>
              <TableHead className="py-3 px-4 font-medium">Ek Ders</TableHead>
              <TableHead className="py-3 px-4 font-medium">Eksik Ders</TableHead>
              <TableHead className="py-3 px-4 font-medium">Toplam</TableHead>
              <TableHead className="py-3 px-4 font-medium">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-neutral-600 text-sm">
            {teacherSummaries.map((summary) => (
              <TableRow key={summary.id} className="border-b">
                <TableCell className="py-3 px-4">{summary.name} {summary.surname}</TableCell>
                <TableCell className="py-3 px-4">{summary.branch}</TableCell>
                <TableCell className="py-3 px-4">{summary.normalLessons}</TableCell>
                <TableCell className="py-3 px-4">
                  <span className={summary.extraLessons > 0 ? "text-success" : ""}>
                    {summary.extraLessons > 0 ? `+${summary.extraLessons}` : "0"}
                  </span>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <span className={summary.missingLessons > 0 ? "text-error" : ""}>
                    {summary.missingLessons > 0 ? `-${summary.missingLessons}` : "0"}
                  </span>
                </TableCell>
                <TableCell className="py-3 px-4">{summary.total}</TableCell>
                <TableCell className="py-3 px-4">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700 h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 flex justify-between">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="text-primary flex items-center hover:underline p-0">
              <PlusCircle className="h-4 w-4 mr-1" />
              <span>Manuel Ek Ders Ekle</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manuel Ek Ders Ekle</DialogTitle>
              <DialogDescription>
                {getTurkishMonthName(month)} {year} ayı için manuel ek ders kaydı oluşturun.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher" className="text-right">
                  Öğretmen
                </Label>
                <div className="col-span-3">
                  <Select
                    value={selectedTeacherId}
                    onValueChange={setSelectedTeacherId}
                  >
                    <SelectTrigger id="teacher">
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers && teachers.map((teacher: any) => (
                        <SelectItem 
                          key={teacher.id} 
                          value={teacher.id.toString()}
                        >
                          {teacher.name} {teacher.surname} ({teacher.branch})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="count" className="text-right">
                  Ders Sayısı
                </Label>
                <div className="col-span-3">
                  <Input
                    id="count"
                    type="number"
                    value={lessonCount}
                    onChange={(e) => setLessonCount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tür
                </Label>
                <div className="col-span-3">
                  <Select
                    value={lessonType}
                    onValueChange={setLessonType}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuel</SelectItem>
                      <SelectItem value="substitution">Yerine Görevlendirme</SelectItem>
                      <SelectItem value="duty">Nöbet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notlar
                </Label>
                <div className="col-span-3">
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="İsteğe bağlı not ekleyin"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleAddExtraLesson}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button className="bg-secondary hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center">
          <Printer className="mr-1 h-4 w-4" />
          <span>Rapor Oluştur</span>
        </Button>
      </div>
    </div>
  );
};

export default ExtraLessonTable;
