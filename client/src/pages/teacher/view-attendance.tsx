import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, Search, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Tip tanımlamaları
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  classId: number;
  className: string;
}

interface HomeworkSession {
  id: number;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Attendance {
  id: number;
  studentId: number;
  date: string;
  sessionType: string;
  present: boolean;
  status: string;
  notes?: string;
}

const ViewAttendancePage: React.FC = () => {
  const today = new Date();
  const formattedDate = format(today, 'dd MMMM yyyy, EEEE', { locale: tr });
  const formattedISODate = format(today, 'yyyy-MM-dd');
  
  // State
  const [sessionType, setSessionType] = useState<string>('homework');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'class' | 'name'>('class'); // 'class' veya 'name' için sıralama seçeneği
  
  // Queries
  const { data: homeworkSessions, isLoading: sessionsLoading } = useQuery<HomeworkSession[]>({
    queryKey: ['/api/teacher/homework-sessions'],
  });
  
  // Tüm öğrenciler
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/teacher/my-students'],
  });
  
  // Yoklama kayıtları
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ['/api/public/attendance-records', { date: formattedISODate }],
  });
  
  // Tüm sınıfları elde etme
  const { data: classes, isLoading: classesLoading } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/teacher/classes'],
  });
  
  // Mevcut oturum bilgisi
  const getCurrentSessionInfo = () => {
    if (!homeworkSessions || sessionsLoading) return null;
    
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1-7 (Pazartesi-Pazar)
    
    // Oturum tipine göre uygun oturumu bul
    let sessionName = '';
    switch (sessionType) {
      case 'homework':
        sessionName = 'Ödev Etüdü';
        break;
      case 'lesson1':
        sessionName = '1. Ders Etüdü';
        break;
      case 'lesson2':
        sessionName = '2. Ders Etüdü';
        break;
      case 'sport':
        sessionName = 'Spor Kursu';
        break;
      case 'art':
        sessionName = 'Sanat Kursu';
        break;
      case 'language':
        sessionName = 'Dil Kursu';
        break;
      default:
        sessionName = 'Ödev Etüdü';
    }
    
    const currentSession = homeworkSessions.find(
      session => session.name.toLowerCase().includes(sessionType.toLowerCase()) && 
                session.dayOfWeek === dayOfWeek
    );
    
    return { ...currentSession, displayName: sessionName };
  };
  
  const currentSession = getCurrentSessionInfo();
  
  // Filtreleme ve arama
  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    
    let results = [...students];
    
    // Sınıf filtresi
    if (selectedClass !== 'all') {
      results = results.filter(student => student.classId.toString() === selectedClass);
    }
    
    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
        (student.fullName && student.fullName.toLowerCase().includes(query)) ||
        student.className?.toLowerCase().includes(query)
      );
    }
    
    // Yoklama verileri varsa filtreleme yok - tüm öğrencileri göster
    
    // Öğrencileri seçilen kritere göre sırala
    return results.sort((a, b) => {
      if (sortBy === 'class') {
        // Önce sınıf numarasına göre sırala (eğer varsa)
        if (a.className && b.className) {
          const aParts = a.className.split('/');
          const bParts = b.className.split('/');
          
          if (aParts.length > 0 && bParts.length > 0) {
            const aClassNum = parseInt(aParts[0]);
            const bClassNum = parseInt(bParts[0]);
            
            if (!isNaN(aClassNum) && !isNaN(bClassNum) && aClassNum !== bClassNum) {
              return aClassNum - bClassNum;
            }
          }
        }
      }
      
      // İsme göre alfabetik sırala
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr');
    });
  }, [students, searchQuery, selectedClass, sortBy]);
  
  // Öğrencinin yoklama durumunu bul
  const getAttendanceStatus = (studentId: number): { present: boolean, status: string } => {
    if (!attendanceRecords) return { present: false, status: 'absent' };
    
    const record = attendanceRecords.find(a => 
      a.studentId === studentId && 
      (a.sessionType === sessionType || a.sessionType?.toLowerCase() === sessionType?.toLowerCase())
    );
    
    if (!record) return { present: false, status: 'absent' };
    
    return { present: record.present, status: record.status };
  };
  
  // Öğrencinin hangi etütlere katıldığını bul
  const getStudentAttendances = (studentId: number): string[] => {
    if (!attendanceRecords) return [];
    
    const studentRecords = attendanceRecords.filter(record => 
      record.studentId === studentId && record.present === true
    );
    
    const attendanceTypes: string[] = [];
    
    // Etüt tiplerine göre kaç tane var
    const hasSport = studentRecords.some(r => r.sessionType === 'sport' && r.present);
    const hasArt = studentRecords.some(r => r.sessionType === 'art' && r.present);
    const hasLanguage = studentRecords.some(r => r.sessionType === 'language' && r.present);
    
    // Eğer spor, sanat veya dil varsa bunları tek bir etiket olarak göster
    if (hasSport || hasArt || hasLanguage) {
      attendanceTypes.push('Spor/Sanat/Dil Kursu');
    }
    
    // Diğer etüt tiplerini ekle
    studentRecords.forEach(record => {
      if (record.sessionType === 'homework') attendanceTypes.push('Ödev Etüdü');
      else if (record.sessionType === 'lesson1') attendanceTypes.push('1. Etüt');
      else if (record.sessionType === 'lesson2') attendanceTypes.push('2. Etüt');
    });
    
    return [...new Set(attendanceTypes)]; // Tekrarlanan değerleri kaldır
  };
  
  // Duruma göre metin renklendirme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'family_pickup':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'not_at_school':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Duruma göre metin
  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Var';
      case 'absent':
        return 'Yok';
      case 'family_pickup':
        return 'Ailesi Aldı';
      case 'not_at_school':
        return 'Okula Gelmedi';
      default:
        return 'Bilinmiyor';
    }
  };
  
  // Yükleniyor durumu
  if (studentsLoading || sessionsLoading || classesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-4">Etüt Yoklama Görüntüleme</h1>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Etüt Yoklama Görüntüleme</h1>
              <p className="text-gray-500 flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                {formattedDate}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tüm Sınıflar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                    {classes && classes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Öğrenci Ara..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Etüt Seçimi ve Yoklama Listesi */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Etüt Türü Seçimi */}
          <div className="p-4 border-b">
            <Tabs defaultValue="homework" onValueChange={setSessionType}>
              <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
                <TabsTrigger value="homework" className="text-xs md:text-sm">Ödev Etüdü</TabsTrigger>
                <TabsTrigger value="lesson1" className="text-xs md:text-sm">1. Etüt</TabsTrigger>
                <TabsTrigger value="lesson2" className="text-xs md:text-sm">2. Etüt</TabsTrigger>
                <TabsTrigger value="sport" className="text-xs md:text-sm">Spor</TabsTrigger>
                <TabsTrigger value="art" className="text-xs md:text-sm">Sanat</TabsTrigger>
                <TabsTrigger value="language" className="text-xs md:text-sm">Dil</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Etüt Bilgisi */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              {currentSession?.displayName || sessionType.toUpperCase()} Yoklaması
            </h2>
            {currentSession ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Clock className="w-4 h-4" />
                <span>{currentSession.startTime} - {currentSession.endTime}</span>
              </div>
            ) : (
              <div className="text-sm text-yellow-600 mt-1">
                Bugün için tanımlı oturum bulunamadı
              </div>
            )}
          </div>
          
          {/* Yoklama Tablosu */}
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center p-8">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {searchQuery || selectedClass !== 'all' 
                    ? "Arama kriterlerine uygun öğrenci bulunamadı."
                    : "Bu etüt için atanmış öğrenci bulunmamaktadır."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead 
                      className={`cursor-pointer hover:text-primary ${sortBy === 'name' ? 'font-bold text-primary' : ''}`}
                      onClick={() => setSortBy('name')}
                    >
                      Öğrenci Adı {sortBy === 'name' && '↓'}
                    </TableHead>
                    <TableHead 
                      className={`cursor-pointer hover:text-primary ${sortBy === 'class' ? 'font-bold text-primary' : ''}`}
                      onClick={() => setSortBy('class')}
                    >
                      Sınıf {sortBy === 'class' && '↓'}
                    </TableHead>
                    <TableHead>Katıldığı Etütler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => {
                    const { present, status } = getAttendanceStatus(student.id);
                    const attendanceTypes = getStudentAttendances(student.id);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>{index+1}</TableCell>
                        <TableCell>{student.fullName || `${student.firstName} ${student.lastName}`}</TableCell>
                        <TableCell>{student.className || "-"}</TableCell>
                        <TableCell>
                          {attendanceTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {attendanceTypes.map((type, idx) => (
                                <Badge 
                                  key={idx}
                                  className="bg-green-100 text-green-800 border-green-300"
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-300">
                              Etüt Yok
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 flex justify-between items-center border-t">
            <div className="text-sm text-gray-500">
              <UserCheck className="inline-block w-4 h-4 mr-1" />
              {filteredStudents.length} öğrenci görüntüleniyor
            </div>
            <div>
              <Button variant="outline" asChild>
                <a href="/">
                  <Users className="mr-2 h-4 w-4" />
                  Yönetim Paneline Dön
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAttendancePage;