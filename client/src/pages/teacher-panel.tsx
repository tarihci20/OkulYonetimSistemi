import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, UserCheck, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  sessionId: number;
  present: boolean;
  status: string;
  notes?: string;
}

interface User {
  id: number;
  username: string;
  fullName: string | null;
  role: string;
  teacherId: number | null;
}

// Saat dilimini ayarla
const dateFormatter = (date: Date): string => {
  return format(date, 'dd MMMM yyyy, EEEE', { locale: tr });
};

const TeacherPanel: React.FC = () => {
  const today = new Date();
  const formattedDate = dateFormatter(today);
  const formattedISODate = format(today, 'yyyy-MM-dd');
  
  // State
  const [attendanceData, setAttendanceData] = useState<Record<number, boolean>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, string>>({});
  const [selectedSessionType, setSelectedSessionType] = useState<string>('homework');
  
  // Queries
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });
  
  const { data: homeworkSessions, isLoading: sessionsLoading } = useQuery<HomeworkSession[]>({
    queryKey: ['/api/homework-sessions'],
  });
  
  // Günlük yoklama verileri - sadece bugünün verilerini çek
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ['/api/homework-attendance', formattedISODate],
    enabled: !!formattedISODate,
  });
  
  // Öğretmenin sorumlu olduğu etüt öğrencileri - role göre filtrelenir
  const { data: studentsForSession, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/teacher/students-for-session', selectedSessionType, formattedISODate],
    enabled: !!selectedSessionType && !!formattedISODate,
  });
  
  // Yoklama alma fonksiyonu
  const toggleAttendance = (studentId: number) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };
  
  // Durumu değiştirme
  const changeStatus = (studentId: number, status: string) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };
  
  // Yoklama kaydetme
  const saveAttendance = async () => {
    // Gerçek implementasyon burada olacak
    alert('Yoklama kaydedildi!');
  };
  
  // Mevcut oturum bilgisi
  const getCurrentSessionInfo = () => {
    if (!homeworkSessions || sessionsLoading) return null;
    
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1-7 (Pazartesi-Pazar)
    
    const currentSession = homeworkSessions.find(
      session => session.name.toLowerCase() === selectedSessionType.toLowerCase() && 
                session.dayOfWeek === dayOfWeek
    );
    
    return currentSession;
  };
  
  const currentSession = getCurrentSessionInfo();
  
  if (userLoading) {
    return <DashboardLayout>Kullanıcı bilgileri yükleniyor...</DashboardLayout>;
  }
  
  if (!currentUser || !currentUser.teacherId) {
    return (
      <DashboardLayout>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Erişim Hatası</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Yetkisiz Erişim</AlertTitle>
              <AlertDescription>
                Bu sayfaya erişim yetkiniz yok. Sadece öğretmen hesapları bu paneli görüntüleyebilir.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Öğretmen Yoklama Paneli</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>

        {/* Etüt Türü Seçimi */}
        <Tabs defaultValue="homework" onValueChange={setSelectedSessionType}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="homework">Ödev Etüdü</TabsTrigger>
            <TabsTrigger value="lesson1">1. Ders Etüdü</TabsTrigger>
            <TabsTrigger value="lesson2">2. Ders Etüdü</TabsTrigger>
            <TabsTrigger value="specialty">Kurslar</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Etüt Bilgisi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {selectedSessionType === 'homework' && 'Ödev Etüdü'}
              {selectedSessionType === 'lesson1' && '1. Ders Etüdü'}
              {selectedSessionType === 'lesson2' && '2. Ders Etüdü'}
              {selectedSessionType === 'specialty' && 'Kurslar'} Yoklaması
            </CardTitle>
            <CardDescription>
              {currentSession ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{currentSession.startTime} - {currentSession.endTime}</span>
                </div>
              ) : (
                <span className="text-yellow-600">Bugün için tanımlı oturum bulunamadı</span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {studentsLoading ? (
              <div className="flex justify-center p-4">Öğrenciler yükleniyor...</div>
            ) : !studentsForSession || studentsForSession.length === 0 ? (
              <div className="text-center p-4">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Bu etüt için atanmış öğrenci bulunmamaktadır.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Öğrenci Adı</TableHead>
                    <TableHead>Sınıf</TableHead>
                    <TableHead className="w-20 text-center">Yoklama</TableHead>
                    <TableHead className="w-40">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsForSession.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index+1}</TableCell>
                      <TableCell>{student.fullName || `${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={attendanceData[student.id] !== false}
                          onCheckedChange={() => toggleAttendance(student.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge 
                            className={`cursor-pointer ${attendanceStatus[student.id] === 'present' ? 'bg-green-500' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => changeStatus(student.id, 'present')}
                          >
                            Var
                          </Badge>
                          <Badge 
                            className={`cursor-pointer ${attendanceStatus[student.id] === 'family_pickup' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => changeStatus(student.id, 'family_pickup')}
                          >
                            Ailesi Aldı
                          </Badge>
                          <Badge 
                            className={`cursor-pointer ${attendanceStatus[student.id] === 'not_at_school' ? 'bg-yellow-500' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => changeStatus(student.id, 'not_at_school')}
                          >
                            Okulda Değil
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          <CardFooter className="justify-between">
            <div className="text-sm text-gray-500">
              <UserCheck className="inline-block w-4 h-4 mr-1" />
              {studentsForSession ? studentsForSession.length : 0} öğrenci
            </div>
            <Button onClick={saveAttendance} disabled={studentsLoading || !studentsForSession || studentsForSession.length === 0}>
              Yoklamayı Kaydet
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherPanel;