import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  Users, 
  Search, 
  Filter, 
  CalendarIcon, 
  Clipboard, 
  BookOpen,
  ChevronDown,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Interfaces
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  classId: number;
  className: string;
  studentNumber?: number;
}

interface HomeworkSession {
  id: number;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface HomeworkAttendance {
  id: number;
  studentId: number;
  date: string;
  sessionType: string;
  present: boolean;
  notes?: string;
}

interface Class {
  id: number;
  name: string;
}

// Session type rengi
const sessionTypeColors: Record<string, string> = {
  'homework': 'bg-blue-100 text-blue-800 border-blue-300',
  'lesson1': 'bg-green-100 text-green-800 border-green-300',
  'lesson2': 'bg-purple-100 text-purple-800 border-purple-300',
  'sport': 'bg-orange-100 text-orange-800 border-orange-300',
  'art': 'bg-pink-100 text-pink-800 border-pink-300',
  'language': 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

// Session type ikonu
const sessionTypeIcons: Record<string, LucideIcon> = {
  'homework': BookOpen,
  'lesson1': BookOpen,
  'lesson2': BookOpen,
  'sport': Users,
  'art': Users,
  'language': Users,
};

// Session type adları
const sessionTypeNames: Record<string, string> = {
  'homework': 'Ödev Etüdü',
  'lesson1': '1. Ders Etüdü',
  'lesson2': '2. Ders Etüdü',
  'sport': 'Spor Kursu',
  'art': 'Sanat Kursu',
  'language': 'Dil Kursu',
};

const TeacherHomeworkAttendancePage: React.FC = () => {
  const { toast } = useToast();
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  // State
  const [selectedDate, setSelectedDate] = useState<string>(formattedToday);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSessionType, setSelectedSessionType] = useState<string>("all");
  
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
  
  // Fetch attendance for the selected date
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<HomeworkAttendance[]>({
    queryKey: ['/api/homework-attendance', selectedDate],
    enabled: !!selectedDate,
  });

  // Seçilen tarihin haftanın hangi günü olduğunu hesapla
  const selectedDay = new Date(selectedDate).getDay();
  const dayOfWeek = selectedDay === 0 ? 7 : selectedDay; // 1-7 (Pazartesi-Pazar)
  
  // Türkçe gün adı
  const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const turkishDayName = dayNames[selectedDay];

  // Başlık formatı
  const formattedDate = format(new Date(selectedDate), 'd MMMM yyyy', { locale: tr });
  
  // Session türüne göre öğrencileri filtrele
  const studentsInSessions = React.useMemo(() => {
    if (!students || !attendanceRecords) return {};
    
    const result: Record<string, Student[]> = {
      'homework': [],
      'lesson1': [],
      'lesson2': [],
      'sport': [],
      'art': [],
      'language': [],
    };
    
    // Her yoklama kaydı için
    attendanceRecords.forEach(record => {
      if (record.present) {
        const student = students.find(s => s.id === record.studentId);
        if (student) {
          if (!result[record.sessionType]) {
            result[record.sessionType] = [];
          }
          result[record.sessionType].push(student);
        }
      }
    });
    
    // Her session içindeki öğrencileri sınıfa göre sırala
    Object.keys(result).forEach(sessionType => {
      result[sessionType].sort((a, b) => {
        // Önce sınıf adına göre sırala (5/A, 6/B, 7/C)
        const aClass = a.className.split('/')[0];
        const bClass = b.className.split('/')[0];
        
        if (aClass !== bClass) {
          return parseInt(aClass) - parseInt(bClass);
        }
        
        // Sonra aynı sınıf içinde soyadına göre sırala
        if (a.lastName !== b.lastName) {
          return a.lastName.localeCompare(b.lastName);
        }
        
        // Son olarak ada göre sırala
        return a.firstName.localeCompare(b.firstName);
      });
    });
    
    return result;
  }, [students, attendanceRecords]);
  
  // Filtreleme: Arama, sınıf ve session türüne göre
  const filteredStudents = React.useMemo(() => {
    if (!students || !attendanceRecords) return [];
    
    // Yoklamada olan öğrencileri bul
    const presentStudents = attendanceRecords
      .filter(record => record.present)
      .map(record => {
        const student = students.find(s => s.id === record.studentId);
        if (student) {
          return {
            ...student,
            sessionType: record.sessionType
          };
        }
        return null;
      })
      .filter(Boolean) as (Student & { sessionType: string })[];
    
    // Arama, sınıf ve session türüne göre filtrele
    return presentStudents.filter(student => {
      // Sınıf filtreleme
      const classMatch = selectedClass === 'all' || student.classId.toString() === selectedClass;
      
      // Session türü filtreleme
      const sessionMatch = selectedSessionType === 'all' || student.sessionType === selectedSessionType;
      
      // Arama filtreleme
      let searchMatch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        searchMatch = 
          student.firstName.toLowerCase().includes(query) || 
          student.lastName.toLowerCase().includes(query) ||
          student.fullName.toLowerCase().includes(query) ||
          (student.studentNumber?.toString() || '').includes(query) ||
          student.className.toLowerCase().includes(query);
      }
      
      return classMatch && sessionMatch && searchMatch;
    });
  }, [students, attendanceRecords, selectedClass, selectedSessionType, searchQuery]);

  // Sınıfa göre öğrenci grupları
  const studentsByClass = React.useMemo(() => {
    if (!filteredStudents || !classes) return {};
    
    const grouped: Record<string, (Student & { sessionType: string })[]> = {};
    
    // Sınıflara göre grupla
    classes.forEach(cls => {
      grouped[cls.name] = filteredStudents.filter(student => student.classId === cls.id);
    });
    
    return grouped;
  }, [filteredStudents, classes]);
  
  // Session türüne göre öğrenci sayıları
  const sessionStudentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      'homework': 0,
      'lesson1': 0,
      'lesson2': 0,
      'sport': 0,
      'art': 0,
      'language': 0,
    };
    
    if (attendanceRecords) {
      attendanceRecords.forEach(record => {
        if (record.present) {
          counts[record.sessionType] = (counts[record.sessionType] || 0) + 1;
        }
      });
    }
    
    return counts;
  }, [attendanceRecords]);

  // Yükleniyor durumu
  if (studentsLoading || classesLoading || sessionsLoading || attendanceLoading) {
    return (
      <DashboardLayout title="Etüt Durumu">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Etüt Durumu - ${formattedDate} ${turkishDayName}`}>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center flex-col sm:flex-row">
            <div>
              <CardTitle className="flex items-center">
                <Clipboard className="mr-2 h-5 w-5 text-primary" />
                <span>Etüt Durumu</span>
              </CardTitle>
              <CardDescription>
                {formattedDate} {turkishDayName} günü etüt durumu ve öğrenci katılımları
              </CardDescription>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-4 mb-6">
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
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="sm:w-48">
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
              <div className="sm:w-48">
                <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Tüm Etütler" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Etütler</SelectItem>
                    <SelectItem value="homework">Ödev Etüdü</SelectItem>
                    <SelectItem value="lesson1">1. Ders Etüdü</SelectItem>
                    <SelectItem value="lesson2">2. Ders Etüdü</SelectItem>
                    <SelectItem value="sport">Spor Kursu</SelectItem>
                    <SelectItem value="art">Sanat Kursu</SelectItem>
                    <SelectItem value="language">Dil Kursu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Özet kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.entries(sessionStudentCounts).map(([sessionType, count]) => {
              const SessionIcon = sessionTypeIcons[sessionType] || BookOpen;
              return (
                <Card 
                  key={sessionType} 
                  className={cn(
                    "border", 
                    count > 0 ? `border-l-4 ${sessionTypeColors[sessionType].split(' ')[0]}` : "",
                    selectedSessionType === sessionType ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => setSelectedSessionType(sessionType === selectedSessionType ? "all" : sessionType)}
                  role="button"
                >
                  <CardContent className="p-4 flex items-center">
                    <div className={cn("p-2 rounded-full mr-3", sessionTypeColors[sessionType].split(' ')[0])}>
                      <SessionIcon className={cn("h-5 w-5", sessionTypeColors[sessionType].split(' ')[1])} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">
                        {sessionTypeNames[sessionType]}
                      </div>
                      <div className="text-xl font-bold">
                        {count} Öğrenci
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="class">Sınıf Görünümü</TabsTrigger>
              <TabsTrigger value="session">Etüt Görünümü</TabsTrigger>
            </TabsList>
            
            {/* Liste Görünümü */}
            <TabsContent value="list">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Öğrenci</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead>Etüt / Kurs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => (
                        <TableRow key={`${student.id}-${student.sessionType}`}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            {student.fullName || `${student.firstName} ${student.lastName}`}
                          </TableCell>
                          <TableCell>{student.className}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "border",
                              sessionTypeColors[student.sessionType]
                            )}>
                              {sessionTypeNames[student.sessionType]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Seçilen kriterlere uygun öğrenci bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            {/* Sınıf Görünümü */}
            <TabsContent value="class">
              {classes && classes.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(studentsByClass)
                    .filter(([_, students]) => students.length > 0)
                    .map(([className, students]) => (
                      <Card key={className} className="overflow-hidden">
                        <CardHeader className="py-3 bg-muted/50">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{className}</CardTitle>
                            <Badge variant="outline">{students.length} Öğrenci</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">No</TableHead>
                                <TableHead>Öğrenci</TableHead>
                                <TableHead>Etüt / Kurs</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {students.map((student, index) => (
                                <TableRow key={`${student.id}-${student.sessionType}`}>
                                  <TableCell className="font-medium">{index + 1}</TableCell>
                                  <TableCell>
                                    {student.fullName || `${student.firstName} ${student.lastName}`}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={cn(
                                      "border",
                                      sessionTypeColors[student.sessionType]
                                    )}>
                                      {sessionTypeNames[student.sessionType]}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))
                  }
                  
                  {Object.keys(studentsByClass).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Seçilen kriterlere uygun sınıf bulunamadı
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sınıf bulunamadı
                </div>
              )}
            </TabsContent>
            
            {/* Etüt Görünümü */}
            <TabsContent value="session">
              <div className="space-y-6">
                {Object.entries(studentsInSessions)
                  .filter(([_, students]) => students.length > 0)
                  .map(([sessionType, students]) => {
                    const SessionIcon = sessionTypeIcons[sessionType] || BookOpen;
                    
                    return (
                      <Card key={sessionType} className={cn(
                        "overflow-hidden border-l-4", 
                        sessionTypeColors[sessionType].split(' ')[0]
                      )}>
                        <CardHeader className="py-3 bg-muted/50">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center">
                              <SessionIcon className={cn("h-5 w-5 mr-2", sessionTypeColors[sessionType].split(' ')[1])} />
                              {sessionTypeNames[sessionType]}
                            </CardTitle>
                            <Badge variant="outline">{students.length} Öğrenci</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">No</TableHead>
                                <TableHead>Öğrenci</TableHead>
                                <TableHead>Sınıf</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {students
                                .filter(student => 
                                  selectedClass === 'all' || student.classId.toString() === selectedClass
                                )
                                .filter(student => {
                                  if (!searchQuery) return true;
                                  const query = searchQuery.toLowerCase();
                                  return (
                                    student.firstName.toLowerCase().includes(query) || 
                                    student.lastName.toLowerCase().includes(query) ||
                                    student.fullName.toLowerCase().includes(query) ||
                                    (student.studentNumber?.toString() || '').includes(query) ||
                                    student.className.toLowerCase().includes(query)
                                  );
                                })
                                .map((student, index) => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                      {student.fullName || `${student.firstName} ${student.lastName}`}
                                    </TableCell>
                                    <TableCell>{student.className}</TableCell>
                                  </TableRow>
                                ))
                              }
                              
                              {students.filter(student => 
                                (selectedClass === 'all' || student.classId.toString() === selectedClass) &&
                                (!searchQuery || 
                                  student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (student.studentNumber?.toString() || '').includes(searchQuery) ||
                                  student.className.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                              ).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    Seçilen kriterlere uygun öğrenci bulunamadı
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })
                }
                
                {Object.entries(studentsInSessions).filter(([_, students]) => students.length > 0).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Bu tarih için kaydedilmiş yoklama bulunamadı
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherHomeworkAttendancePage;