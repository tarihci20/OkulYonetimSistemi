import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, Users, Search, Calendar, Copy, Filter, PlusCircle, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Öğrenci tipi
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  classId: number;
  className: string;
  studentNumber?: number;
}

// Etüt tipi
interface HomeworkSession {
  id: number;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Öğrenci kurs bilgisi tipi
interface StudentCourse {
  id: number;
  studentId: number;
  courseType: string;
  dayOfWeek: number;
}

// Yoklama kaydı tipi
interface HomeworkAttendance {
  id: number;
  studentId: number;
  date: string;
  sessionType: string;
  present: boolean;
  status?: string; // 'present', 'absent', 'family_pickup', 'not_at_school'
  notes?: string;
}

// Sınıf tipi
interface Class {
  id: number;
  name: string;
}

const HomeworkAttendancePage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  // State
  const [selectedDate, setSelectedDate] = useState<string>(formattedToday);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState<Record<number, Record<string, boolean>>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, Record<string, string>>>({});
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // A-Z (asc) veya Z-A (desc) sıralama
  
  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
  
  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });
  
  // Fetch all homework sessions
  const { data: homeworkSessions, isLoading: sessionsLoading } = useQuery<HomeworkSession[]>({
    queryKey: ['/api/homework-sessions'],
  });
  
  // Fetch student courses
  const { data: studentCourses, isLoading: coursesLoading } = useQuery<StudentCourse[]>({
    queryKey: ['/api/student-courses'],
  });
  
  // Fetch attendance for the selected date
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<HomeworkAttendance[]>({
    queryKey: ['/api/homework-attendance', selectedDate],
    enabled: !!selectedDate,
  });
  
  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/homework-attendance/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Yoklama kaydedilirken bir hata oluştu');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Verileri yenile
      queryClient.invalidateQueries({ queryKey: ['/api/homework-attendance', selectedDate] });
      
      toast({
        title: "Yoklama kaydedildi",
        description: "Öğrenci yoklamaları başarıyla kaydedildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata oluştu",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Initialize attendance data from records
  React.useEffect(() => {
    if (!attendanceRecords || !students) return;
    
    const newAttendanceData: Record<number, Record<string, boolean>> = {};
    
    // Tüm öğrenciler için varsayılan değerler
    students.forEach(student => {
      newAttendanceData[student.id] = {
        'homework': false,
        'lesson1': false,
        'lesson2': false,
        'sport': false,
        'art': false,
        'language': false
      };
    });
    
    // Kayıtlı yoklamaları ekle
    attendanceRecords.forEach(record => {
      if (newAttendanceData[record.studentId]) {
        newAttendanceData[record.studentId][record.sessionType] = record.present;
      }
    });
    
    setAttendanceData(newAttendanceData);
  }, [attendanceRecords, students]);
  
  // Öğrenci kursu var mı kontrol et
  const hasStudentCourse = (studentId: number, courseType: string, dayOfWeek: number): boolean => {
    if (!studentCourses) return false;
    
    return studentCourses.some(
      course => course.studentId === studentId && 
                course.courseType === courseType && 
                course.dayOfWeek === dayOfWeek
    );
  };
  
  // Toggle attendance
  const toggleAttendance = (studentId: number, sessionType: string) => {
    setAttendanceData(prev => {
      const newData = { ...prev };
      
      // Öğrenci kaydı yoksa oluştur
      if (!newData[studentId]) {
        newData[studentId] = {
          'homework': false,
          'lesson1': false,
          'lesson2': false,
          'sport': false,
          'art': false,
          'language': false
        };
      }
      
      // Durumu tersine çevir
      newData[studentId][sessionType] = !newData[studentId][sessionType];
      
      // Ödev etüdü ile ders etütleri birbirini etkiler
      if (sessionType === 'homework' && newData[studentId][sessionType]) {
        // Ödev etüdü seçildiğinde ders etütlerini kapat
        newData[studentId]['lesson1'] = false;
        newData[studentId]['lesson2'] = false;
      } else if ((sessionType === 'lesson1' || sessionType === 'lesson2') && newData[studentId][sessionType]) {
        // Ders etüdü seçildiğinde ödev etüdünü kapat
        newData[studentId]['homework'] = false;
      }
      
      return newData;
    });
  };
  
  // Tümünü seç - belirli bir etüt için tüm öğrencileri seç
  const selectAll = (sessionType: string) => {
    if (!students) return;
    
    // Filtrelenmiş öğrencileri al
    const studentsToSelect = filteredStudents;
    
    setAttendanceData(prev => {
      const newData = { ...prev };
      
      studentsToSelect.forEach(student => {
        // Öğrenci kaydı yoksa oluştur
        if (!newData[student.id]) {
          newData[student.id] = {
            'homework': false,
            'lesson1': false,
            'lesson2': false,
            'sport': false,
            'art': false,
            'language': false
          };
        }
        
        // Eğer kurs tipi ise ve öğrencinin bu kursu yoksa seçme
        if (
          (sessionType === 'sport' && !hasStudentCourse(student.id, 'sport', dayOfWeek)) ||
          (sessionType === 'art' && !hasStudentCourse(student.id, 'art', dayOfWeek)) ||
          (sessionType === 'language' && !hasStudentCourse(student.id, 'language', dayOfWeek))
        ) {
          return;
        }
        
        // İlgili etüdü seç
        newData[student.id][sessionType] = true;
        
        // Ödev etüdü ile ders etütleri birbirini etkiler
        if (sessionType === 'homework') {
          // Ödev etüdü seçildiğinde ders etütlerini kapat
          newData[student.id]['lesson1'] = false;
          newData[student.id]['lesson2'] = false;
        } else if (sessionType === 'lesson1' || sessionType === 'lesson2') {
          // Ders etüdü seçildiğinde ödev etüdünü kapat
          newData[student.id]['homework'] = false;
        }
      });
      
      return newData;
    });
    
    toast({
      title: "Tümü seçildi",
      description: `Tüm öğrenciler ${getSessionTypeName(sessionType)} için seçildi.`,
    });
  };
  
  // Tümünü kaldır - belirli bir etüt için tüm öğrencileri seçimi kaldır
  const deselectAll = (sessionType: string) => {
    if (!students) return;
    
    // Filtrelenmiş öğrencileri al
    const studentsToDeselect = filteredStudents;
    
    setAttendanceData(prev => {
      const newData = { ...prev };
      
      studentsToDeselect.forEach(student => {
        // Öğrenci kaydı varsa seçimi kaldır
        if (newData[student.id]) {
          newData[student.id][sessionType] = false;
        }
      });
      
      return newData;
    });
    
    toast({
      title: "Tümü kaldırıldı",
      description: `Tüm öğrencilerin ${getSessionTypeName(sessionType)} seçimi kaldırıldı.`,
    });
  };
  
  // Etüt türü adını döndür
  const getSessionTypeName = (sessionType: string): string => {
    const sessionTypeNames: Record<string, string> = {
      'homework': 'Ödev Etüdü',
      'lesson1': '1. Ders Etüt',
      'lesson2': '2. Ders Etüt',
      'sport': 'Spor Kursu',
      'art': 'Sanat Kursu',
      'language': 'Dil Kursu'
    };
    
    return sessionTypeNames[sessionType] || sessionType;
  };
  
  // Attendance status options
  const statusOptions = [
    { value: 'present', label: 'Mevcut' },
    { value: 'absent', label: 'Yok' },
    { value: 'family_pickup', label: 'Ailesi Aldı' },
    { value: 'not_at_school', label: 'Okula Gelmedi' }
  ];
  
  // Set attendance status
  const setStudentStatus = (studentId: number, sessionType: string, status: string) => {
    setAttendanceStatus(prev => {
      const newData = { ...prev };
      
      // Öğrenci kaydı yoksa oluştur
      if (!newData[studentId]) {
        newData[studentId] = {
          'homework': 'present',
          'lesson1': 'present',
          'lesson2': 'present',
          'sport': 'present',
          'art': 'present',
          'language': 'present'
        };
      }
      
      // Durumu güncelle
      newData[studentId][sessionType] = status;
      
      return newData;
    });
  };
  
  // Save all attendance
  const saveAllAttendance = () => {
    if (!students || !selectedDate) return;
    
    const records: any[] = [];
    
    // Her öğrenci için yoklama kayıtlarını oluştur
    students.forEach(student => {
      if (attendanceData[student.id]) {
        Object.entries(attendanceData[student.id]).forEach(([sessionType, present]) => {
          // Durumu kontrol et, varsayılan değer "present"
          const status = attendanceStatus[student.id]?.[sessionType] || 'present';
          
          records.push({
            studentId: student.id,
            date: selectedDate,
            sessionType,
            present,
            status: present ? status : 'absent' // Eğer present false ise status absent olmalı
          });
        });
      }
    });
    
    saveAttendanceMutation.mutate({ records });
  };
  
  // Filtre ve Arama
  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    
    let filtered = [...students];
    
    // Sınıf filtreleme
    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => student.classId.toString() === selectedClass);
    }
    
    // Arama filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.firstName.toLowerCase().includes(query) || 
        student.lastName.toLowerCase().includes(query) ||
        student.fullName.toLowerCase().includes(query) ||
        (student.studentNumber?.toString() || '').includes(query)
      );
    }
    
    // Bu filtrelenmiş öğrenci listesini önce sınıflara göre sırala
    const sortedByClass = filtered.sort((a, b) => {
      // Önce sınıf adına göre sırala (5/A, 6/B, 7/C)
      const aClass = a.className.split('/')[0];
      const bClass = b.className.split('/')[0];
      
      if (aClass !== bClass) {
        return parseInt(aClass) - parseInt(bClass);
      }
      
      return 0; // Aynı sınıftaysa değişiklik yapma
    });
    
    // İsim sıralaması için yeni bir sıralama uygula
    // Aynı sınıftaki öğrencileri soyadına göre sırala
    return [...sortedByClass].sort((a, b) => {
      // Farklı sınıftaysa sınıf sıralamasını koru
      const aClass = a.className.split('/')[0];
      const bClass = b.className.split('/')[0];
      
      if (aClass !== bClass) {
        return parseInt(aClass) - parseInt(bClass);
      }
      
      // Aynı sınıfta ise, isme göre sırala (A-Z veya Z-A)
      if (sortDirection === 'asc') {
        return a.lastName.localeCompare(b.lastName, 'tr');
      } else {
        return b.lastName.localeCompare(a.lastName, 'tr');
      }
    });
  }, [students, selectedClass, searchQuery, sortDirection]);
  
  // Sınıfa göre öğrenci grupları
  const studentsByClass = React.useMemo(() => {
    if (!filteredStudents || !classes) return {};
    
    const grouped: Record<string, Student[]> = {};
    
    // Sınıflara göre grupla
    classes.forEach(cls => {
      // Her sınıf için öğrencileri filtrele
      const classStudents = filteredStudents.filter(student => student.classId === cls.id);
      
      // Sınıf içinde soyadına göre sırala (A-Z veya Z-A)
      const sortedClassStudents = [...classStudents].sort((a, b) => {
        if (sortDirection === 'asc') {
          return a.lastName.localeCompare(b.lastName, 'tr');
        } else {
          return b.lastName.localeCompare(a.lastName, 'tr');
        }
      });
      
      grouped[cls.name] = sortedClassStudents;
    });
    
    return grouped;
  }, [filteredStudents, classes, sortDirection]);
  
  // Ödev etüdündeki öğrenci sayısını hesapla
  const countHomeworkStudents = (classId?: number): number => {
    if (!students || !attendanceData) return 0;
    
    return students
      .filter(student => classId ? student.classId === classId : true)
      .reduce((count, student) => {
        if (attendanceData[student.id]?.['homework']) {
          return count + 1;
        }
        return count;
      }, 0);
  };
  
  // Yükleniyor durumu
  if (studentsLoading || classesLoading || sessionsLoading || coursesLoading || attendanceLoading) {
    return (
      <DashboardLayout title="Etüt Yoklama">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Seçilen tarihin haftanın hangi günü olduğunu hesapla
  const selectedDay = new Date(selectedDate).getDay();
  const dayOfWeek = selectedDay === 0 ? 7 : selectedDay; // 1-7 (Pazartesi-Pazar)
  
  return (
    <DashboardLayout title="Etüt Yoklama">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                <span>Etüt Yoklama</span>
              </CardTitle>
              <CardDescription>
                Öğrencilerin etüt yoklamalarının takibi ve yönetimi
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <Button onClick={saveAllAttendance} disabled={saveAttendanceMutation.isPending}>
                {saveAttendanceMutation.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                )}
                Yoklama Kaydet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Öğrenci ara..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="md:w-60">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Tüm Sınıflar" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                    {classes && classes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                className="flex items-center whitespace-nowrap"
              >
                {sortDirection === "asc" ? (
                  <>
                    <span>A-Z</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="m3 16 4 4 4-4"></path>
                      <path d="M7 20V4"></path>
                      <path d="M11 4h4"></path>
                      <path d="M11 8h7"></path>
                      <path d="M11 12h10"></path>
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Z-A</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="m3 8 4-4 4 4"></path>
                      <path d="M7 4v16"></path>
                      <path d="M11 12h4"></path>
                      <path d="M11 16h7"></path>
                      <path d="M11 20h10"></path>
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="class">Sınıf Görünümü</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Öğrenci</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => selectAll('homework')}
                              className="text-xs py-1 h-7 mr-1"
                            >
                              Tümünü Seç
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deselectAll('homework')}
                              className="text-xs py-1 h-7"
                            >
                              Tümünü Kaldır
                            </Button>
                          </div>
                          Ödev Etüdü
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => selectAll('lesson1')}
                              className="text-xs py-1 h-7 mr-1"
                            >
                              Tümünü Seç
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deselectAll('lesson1')}
                              className="text-xs py-1 h-7"
                            >
                              Tümünü Kaldır
                            </Button>
                          </div>
                          1. Ders Etüt
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => selectAll('lesson2')}
                              className="text-xs py-1 h-7 mr-1"
                            >
                              Tümünü Seç
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deselectAll('lesson2')}
                              className="text-xs py-1 h-7"
                            >
                              Tümünü Kaldır
                            </Button>
                          </div>
                          2. Ders Etüt
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => selectAll('sport')}
                              className="text-xs py-1 h-7 mr-1"
                            >
                              Tümünü Seç
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deselectAll('sport')}
                              className="text-xs py-1 h-7"
                            >
                              Tümünü Kaldır
                            </Button>
                          </div>
                          Spor Kursu
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => selectAll('art')}
                              className="text-xs py-1 h-7 mr-1"
                            >
                              Tümünü Seç
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deselectAll('art')}
                              className="text-xs py-1 h-7"
                            >
                              Tümünü Kaldır
                            </Button>
                          </div>
                          Sanat Kursu
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-between items-center w-full mb-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => selectAll('language')}
                              className="text-xs py-1 h-7 mr-1"
                            >
                              Tümünü Seç
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deselectAll('language')}
                              className="text-xs py-1 h-7"
                            >
                              Tümünü Kaldır
                            </Button>
                          </div>
                          Dil Kursu
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            {student.fullName || `${student.firstName} ${student.lastName}`}
                          </TableCell>
                          <TableCell>{student.className}</TableCell>
                          
                          {/* Ödev Etüdü */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Checkbox
                                checked={attendanceData[student.id]?.['homework'] || false}
                                onCheckedChange={() => toggleAttendance(student.id, 'homework')}
                                className="mx-auto mb-1"
                              />
                              {attendanceData[student.id]?.['homework'] && (
                                <Select
                                  value={attendanceStatus[student.id]?.['homework'] || 'present'}
                                  onValueChange={(value) => setStudentStatus(student.id, 'homework', value)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* 1. Ders Etüt */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Checkbox
                                checked={attendanceData[student.id]?.['lesson1'] || false}
                                onCheckedChange={() => toggleAttendance(student.id, 'lesson1')}
                                className="mx-auto mb-1"
                              />
                              {attendanceData[student.id]?.['lesson1'] && (
                                <Select
                                  value={attendanceStatus[student.id]?.['lesson1'] || 'present'}
                                  onValueChange={(value) => setStudentStatus(student.id, 'lesson1', value)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* 2. Ders Etüt */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Checkbox
                                checked={attendanceData[student.id]?.['lesson2'] || false}
                                onCheckedChange={() => toggleAttendance(student.id, 'lesson2')}
                                className="mx-auto mb-1"
                              />
                              {attendanceData[student.id]?.['lesson2'] && (
                                <Select
                                  value={attendanceStatus[student.id]?.['lesson2'] || 'present'}
                                  onValueChange={(value) => setStudentStatus(student.id, 'lesson2', value)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Spor Kursu */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Checkbox
                                checked={attendanceData[student.id]?.['sport'] || false}
                                onCheckedChange={() => toggleAttendance(student.id, 'sport')}
                                className={cn("mx-auto mb-1", 
                                  hasStudentCourse(student.id, 'sport', dayOfWeek) ? "bg-amber-100" : ""
                                )}
                                disabled={!hasStudentCourse(student.id, 'sport', dayOfWeek)}
                              />
                              {attendanceData[student.id]?.['sport'] && hasStudentCourse(student.id, 'sport', dayOfWeek) && (
                                <Select
                                  value={attendanceStatus[student.id]?.['sport'] || 'present'}
                                  onValueChange={(value) => setStudentStatus(student.id, 'sport', value)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Sanat Kursu */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Checkbox
                                checked={attendanceData[student.id]?.['art'] || false}
                                onCheckedChange={() => toggleAttendance(student.id, 'art')}
                                className={cn("mx-auto mb-1", 
                                  hasStudentCourse(student.id, 'art', dayOfWeek) ? "bg-amber-100" : ""
                                )}
                                disabled={!hasStudentCourse(student.id, 'art', dayOfWeek)}
                              />
                              {attendanceData[student.id]?.['art'] && hasStudentCourse(student.id, 'art', dayOfWeek) && (
                                <Select
                                  value={attendanceStatus[student.id]?.['art'] || 'present'}
                                  onValueChange={(value) => setStudentStatus(student.id, 'art', value)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Dil Kursu */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Checkbox
                                checked={attendanceData[student.id]?.['language'] || false}
                                onCheckedChange={() => toggleAttendance(student.id, 'language')}
                                className={cn("mx-auto mb-1", 
                                  hasStudentCourse(student.id, 'language', dayOfWeek) ? "bg-amber-100" : ""
                                )}
                                disabled={!hasStudentCourse(student.id, 'language', dayOfWeek)}
                              />
                              {attendanceData[student.id]?.['language'] && hasStudentCourse(student.id, 'language', dayOfWeek) && (
                                <Select
                                  value={attendanceStatus[student.id]?.['language'] || 'present'}
                                  onValueChange={(value) => setStudentStatus(student.id, 'language', value)}
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          Öğrenci kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="class">
              <div className="space-y-6">
                {classes && classes
                  .sort((a, b) => {
                    const aGrade = parseInt(a.name.split('/')[0]);
                    const bGrade = parseInt(b.name.split('/')[0]);
                    return aGrade - bGrade;
                  })
                  .map(cls => {
                    const classStudents = studentsByClass[cls.name] || [];
                    if (selectedClass !== 'all' && cls.id.toString() !== selectedClass) return null;
                    if (classStudents.length === 0) return null;
                    
                    return (
                      <div key={cls.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-lg flex items-center">
                            <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                            {cls.name} 
                            <Badge variant="secondary" className="ml-2">
                              {classStudents.length} öğrenci
                            </Badge>
                          </h3>
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            Ödev Etüdü: {countHomeworkStudents(cls.id)} öğrenci
                          </Badge>
                        </div>
                        
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">No</TableHead>
                                <TableHead>Öğrenci</TableHead>
                                <TableHead className="text-center">Ödev Etüdü</TableHead>
                                <TableHead className="text-center">1. Ders Etüt</TableHead>
                                <TableHead className="text-center">2. Ders Etüt</TableHead>
                                <TableHead className="text-center">Spor Kursu</TableHead>
                                <TableHead className="text-center">Sanat Kursu</TableHead>
                                <TableHead className="text-center">Dil Kursu</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {classStudents.length > 0 ? (
                                classStudents.map((student, index) => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                      {student.fullName || `${student.firstName} ${student.lastName}`}
                                    </TableCell>
                                    
                                    {/* Ödev Etüdü */}
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={attendanceData[student.id]?.['homework'] || false}
                                        onCheckedChange={() => toggleAttendance(student.id, 'homework')}
                                        className="mx-auto"
                                      />
                                    </TableCell>
                                    
                                    {/* 1. Ders Etüt */}
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={attendanceData[student.id]?.['lesson1'] || false}
                                        onCheckedChange={() => toggleAttendance(student.id, 'lesson1')}
                                        className="mx-auto"
                                      />
                                    </TableCell>
                                    
                                    {/* 2. Ders Etüt */}
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={attendanceData[student.id]?.['lesson2'] || false}
                                        onCheckedChange={() => toggleAttendance(student.id, 'lesson2')}
                                        className="mx-auto"
                                      />
                                    </TableCell>
                                    
                                    {/* Spor Kursu */}
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={attendanceData[student.id]?.['sport'] || false}
                                        onCheckedChange={() => toggleAttendance(student.id, 'sport')}
                                        className={cn("mx-auto", 
                                          hasStudentCourse(student.id, 'sport', dayOfWeek) ? "bg-amber-100" : ""
                                        )}
                                        disabled={!hasStudentCourse(student.id, 'sport', dayOfWeek)}
                                      />
                                    </TableCell>
                                    
                                    {/* Sanat Kursu */}
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={attendanceData[student.id]?.['art'] || false}
                                        onCheckedChange={() => toggleAttendance(student.id, 'art')}
                                        className={cn("mx-auto", 
                                          hasStudentCourse(student.id, 'art', dayOfWeek) ? "bg-amber-100" : ""
                                        )}
                                        disabled={!hasStudentCourse(student.id, 'art', dayOfWeek)}
                                      />
                                    </TableCell>
                                    
                                    {/* Dil Kursu */}
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={attendanceData[student.id]?.['language'] || false}
                                        onCheckedChange={() => toggleAttendance(student.id, 'language')}
                                        className={cn("mx-auto", 
                                          hasStudentCourse(student.id, 'language', dayOfWeek) ? "bg-amber-100" : ""
                                        )}
                                        disabled={!hasStudentCourse(student.id, 'language', dayOfWeek)}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={8} className="h-24 text-center">
                                    Öğrenci kaydı bulunamadı
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-xs text-muted-foreground">
              Toplam {filteredStudents.length} öğrenci / Ödev Etüdü: {countHomeworkStudents()} öğrenci
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Rapor İndir
            </Button>
          </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
};

export default HomeworkAttendancePage;