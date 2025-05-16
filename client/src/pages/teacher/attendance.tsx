import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import TeacherLayout from '@/components/layout/teacher-layout';
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
import { useToast } from '@/hooks/use-toast';
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
  sessionType: string;
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

const TeacherAttendancePage: React.FC = () => {
  const today = new Date();
  const formattedDate = format(today, 'dd MMMM yyyy, EEEE', { locale: tr });
  const formattedISODate = format(today, 'yyyy-MM-dd');
  const { toast } = useToast();
  
  // State
  const [sessionType, setSessionType] = useState<string>('homework');
  const [attendanceData, setAttendanceData] = useState<Record<number, boolean>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, string>>({});
  
  // Queries
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });
  
  const { data: homeworkSessions, isLoading: sessionsLoading } = useQuery<HomeworkSession[]>({
    queryKey: ['/api/homework-sessions'],
  });
  
  // Öğretmenin sorumlu olduğu etüt öğrencileri
  const { data: studentsForSession, isLoading: studentsLoading, refetch: refetchStudents } = useQuery<Student[]>({
    queryKey: ['/api/teacher/students-for-session', sessionType, formattedISODate],
    enabled: !!sessionType && !!formattedISODate,
  });
  
  // Mevcut yoklama verileri
  const { data: attendanceRecords, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery<Attendance[]>({
    queryKey: ['/api/teacher/attendance', sessionType, formattedISODate],
    enabled: !!sessionType && !!formattedISODate,
    onSuccess: (data) => {
      // Yoklama verilerini state'e yükle
      const presentMap: Record<number, boolean> = {};
      const statusMap: Record<number, string> = {};
      
      data?.forEach(record => {
        presentMap[record.studentId] = record.present;
        statusMap[record.studentId] = record.status;
      });
      
      setAttendanceData(presentMap);
      setAttendanceStatus(statusMap);
    }
  });
  
  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: {
      date: string,
      sessionType: string,
      records: {
        studentId: number,
        present: boolean,
        status: string
      }[]
    }) => {
      const response = await fetch('/api/teacher/save-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yoklama kaydedilirken bir hata oluştu');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Yoklama başarıyla kaydedildi.",
        duration: 3000,
      });
      refetchAttendance();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata!",
        description: error.message || "Yoklama kaydedilirken bir hata oluştu.",
        duration: 5000,
      });
    }
  });
  
  // Yoklama işlemleri
  const toggleAttendance = (studentId: number) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };
  
  const changeStatus = (studentId: number, status: string) => {
    // Eğer "present" durumu seçilmişse, yoklama durumunu true yap
    if (status === 'present') {
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: true
      }));
    } 
    // Eğer başka bir durum seçilmişse, yoklama durumunu false yap
    else {
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: false
      }));
    }
    
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };
  
  const saveAttendance = async () => {
    if (!studentsForSession || studentsForSession.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kaydedilecek öğrenci bulunamadı.",
        duration: 3000,
      });
      return;
    }
    
    // Tüm öğrenciler için yoklama kayıtlarını hazırla
    const records = studentsForSession.map(student => {
      // Öğrenci için yoklama verisi (varsayılan olarak false)
      const isPresent = attendanceData[student.id] === true;
      // Öğrenci için durum (varsayılan olarak 'absent')
      const status = attendanceStatus[student.id] || (isPresent ? 'present' : 'absent');
      
      return {
        studentId: student.id,
        present: isPresent,
        status: status
      };
    });
    
    // Yoklama verilerini kaydet
    saveMutation.mutate({
      date: formattedISODate,
      sessionType: sessionType,
      records: records
    });
  };
  
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
  
  // Yükleme durumlarını kontrol et
  if (userLoading) {
    return <TeacherLayout title="Etüt Yoklama">Kullanıcı bilgileri yükleniyor...</TeacherLayout>;
  }
  
  // Yetkisiz erişim kontrolü
  if (!currentUser || !currentUser.teacherId) {
    return (
      <TeacherLayout title="Erişim Hatası">
        <Card>
          <CardHeader>
            <CardTitle>Erişim Hatası</CardTitle>
            <CardDescription>Bu sayfaya erişim yetkiniz bulunmamaktadır.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Yetkisiz Erişim</AlertTitle>
              <AlertDescription>
                Bu sayfa sadece öğretmen hesapları için erişilebilirdir.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/api/logout">Çıkış Yap</a>
            </Button>
          </CardFooter>
        </Card>
      </TeacherLayout>
    );
  }
  
  return (
    <TeacherLayout title="Etüt Yoklama">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Etüt Yoklama</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>
        
        {/* Etüt Türü Seçimi */}
        <Tabs defaultValue="homework" onValueChange={setSessionType}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="homework">Ödev Etüdü</TabsTrigger>
            <TabsTrigger value="lesson1">1. Ders Etüdü</TabsTrigger>
            <TabsTrigger value="lesson2">2. Ders Etüdü</TabsTrigger>
            <TabsTrigger value="sport">Spor</TabsTrigger>
            <TabsTrigger value="art">Sanat</TabsTrigger>
            <TabsTrigger value="language">Dil</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Etüt Yoklama Kartı */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentSession?.displayName || sessionType.toUpperCase()} Yoklaması
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
              <div className="flex justify-center p-8">
                <p>Öğrenciler yükleniyor...</p>
              </div>
            ) : !studentsForSession || studentsForSession.length === 0 ? (
              <div className="text-center p-8">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Bu etüt için atanmış öğrenci bulunmamaktadır.</p>
                <p className="text-sm text-gray-500">Eğer bu bir hata olduğunu düşünüyorsanız, lütfen sistem yöneticisi ile iletişime geçin.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Öğrenci Adı</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead className="w-20 text-center">Yoklama</TableHead>
                      <TableHead className="w-72">Durum</TableHead>
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
                            checked={attendanceData[student.id] === true}
                            onCheckedChange={() => toggleAttendance(student.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Badge 
                              className={`cursor-pointer ${attendanceStatus[student.id] === 'present' ? 'bg-green-500' : 'bg-gray-200 text-gray-800'}`}
                              onClick={() => changeStatus(student.id, 'present')}
                            >
                              Var
                            </Badge>
                            <Badge 
                              className={`cursor-pointer ${attendanceStatus[student.id] === 'absent' ? 'bg-red-500' : 'bg-gray-200 text-gray-800'}`}
                              onClick={() => changeStatus(student.id, 'absent')}
                            >
                              Yok
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
                              Okula Gelmedi
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="justify-between">
            <div className="text-sm text-gray-500">
              <UserCheck className="inline-block w-4 h-4 mr-1" />
              {studentsForSession ? studentsForSession.length : 0} öğrenci
            </div>
            <Button 
              onClick={saveAttendance} 
              disabled={studentsLoading || !studentsForSession || studentsForSession.length === 0 || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TeacherLayout>
  );
};

export default TeacherAttendancePage;