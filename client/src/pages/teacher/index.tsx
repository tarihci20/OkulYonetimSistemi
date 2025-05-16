import React from 'react';
import { useQuery } from '@tanstack/react-query';
import TeacherLayout from '@/components/layout/teacher-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, BookOpen, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'wouter';

// Tip tanımlamaları
interface User {
  id: number;
  username: string;
  fullName: string | null;
  role: string;
  teacherId: number | null;
}

interface Teacher {
  id: number;
  name: string;
  surname: string;
  fullName: string;
  branch: string;
}

const TeacherHomePage: React.FC = () => {
  const today = new Date();
  const formattedDate = format(today, 'dd MMMM yyyy, EEEE', { locale: tr });
  
  // Queries
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/teacher/auth/user'],
  });
  
  const { data: teacherData, isLoading: teacherLoading } = useQuery<Teacher>({
    queryKey: ['/api/teacher/profile'],
    enabled: !!currentUser?.teacherId,
  });
  
  if (userLoading || teacherLoading) {
    return <TeacherLayout>Yükleniyor...</TeacherLayout>;
  }
  
  if (!currentUser || !currentUser.teacherId) {
    return (
      <TeacherLayout>
        <Card>
          <CardHeader>
            <CardTitle>Erişim Hatası</CardTitle>
            <CardDescription>Bu sayfaya erişim yetkiniz bulunmamaktadır.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Bu sayfa sadece öğretmen hesapları için erişilebilirdir.</p>
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
    <TeacherLayout title="Öğretmen Paneli">
      <div className="space-y-6">
        {/* Karşılama Kartı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Hoş Geldiniz, {teacherData?.fullName || currentUser.fullName || currentUser.username}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              {formattedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Öğretmen panelinden etüt yoklaması alabilir ve öğrenci bilgilerini görüntüleyebilirsiniz.
            </p>
          </CardContent>
        </Card>
        
        {/* Hızlı Erişim Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Etüt Yoklama Kartı */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ClipboardList className="mr-2 h-5 w-5" />
                Etüt Yoklama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bugünkü etüt yoklamalarını alın ve takip edin.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" className="w-full">
                <Link href="/teacher/attendance">
                  Yoklama Al
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Öğrenci Listesi Kartı */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Öğrenci Listesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tüm öğrencilerinizi görüntüleyin ve bilgilerine erişin.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/teacher/students">
                  Öğrencileri Görüntüle
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Ders Programı Kartı */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Ders Programı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Haftalık ders ve etüt programınızı görüntüleyin.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/teacher/schedule">
                  Programı Görüntüle
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherHomePage;