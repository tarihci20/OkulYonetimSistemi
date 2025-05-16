import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TeacherLayout from '@/components/layout/teacher-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck } from 'lucide-react';

// Tip tanımlamaları
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  classId: number;
  className: string;
  studentNumber?: number;
}

interface User {
  id: number;
  username: string;
  fullName: string | null;
  role: string;
  teacherId: number | null;
}

interface StudentCourse {
  id: number;
  studentId: number;
  courseType: string;
  courseName: string;
}

const TeacherStudentsPage: React.FC = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Queries
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });
  
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/teacher/my-students'],
    enabled: !!currentUser?.teacherId,
  });
  
  const { data: studentCourses, isLoading: coursesLoading } = useQuery<StudentCourse[]>({
    queryKey: ['/api/student-courses'],
  });
  
  // Öğrenci kurslarını bul
  const getStudentCourses = (studentId: number) => {
    if (!studentCourses) return [];
    return studentCourses.filter(course => course.studentId === studentId);
  };
  
  // Öğrenci listesini filtrele
  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    
    if (!searchQuery) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter(student => 
      student.firstName.toLowerCase().includes(query) || 
      student.lastName.toLowerCase().includes(query) || 
      (student.fullName && student.fullName.toLowerCase().includes(query)) ||
      student.className.toLowerCase().includes(query) ||
      (student.studentNumber?.toString() || '').includes(query)
    );
  }, [students, searchQuery]);
  
  if (userLoading) {
    return <TeacherLayout title="Öğrenciler">Kullanıcı bilgileri yükleniyor...</TeacherLayout>;
  }
  
  if (!currentUser || !currentUser.teacherId) {
    return (
      <TeacherLayout title="Erişim Hatası">
        <Card>
          <CardHeader>
            <CardTitle>Erişim Hatası</CardTitle>
            <CardDescription>Bu sayfaya erişim yetkiniz bulunmamaktadır.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Bu sayfa sadece öğretmen hesapları için erişilebilirdir.</p>
          </CardContent>
        </Card>
      </TeacherLayout>
    );
  }
  
  return (
    <TeacherLayout title="Öğrenciler">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Öğrenci Listesi</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Öğrenci Ara..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Tüm Öğrenciler</CardTitle>
            <CardDescription>
              Size atanmış tüm öğrencilerin listesi
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {studentsLoading ? (
              <div className="flex justify-center p-8">
                <p>Öğrenciler yükleniyor...</p>
              </div>
            ) : !filteredStudents || filteredStudents.length === 0 ? (
              <div className="text-center p-8">
                <UserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {searchQuery 
                    ? "Arama kriterine uygun öğrenci bulunamadı." 
                    : "Henüz size atanmış öğrenci bulunmamaktadır."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Öğrenci Adı</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead>Kurslar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>{index+1}</TableCell>
                        <TableCell>
                          {student.fullName || `${student.firstName} ${student.lastName}`}
                          {student.studentNumber && (
                            <span className="block text-xs text-gray-500">
                              No: {student.studentNumber}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getStudentCourses(student.id).map(course => (
                              <Badge 
                                key={course.id}
                                variant="outline"
                                className={
                                  course.courseType === 'sport' 
                                    ? 'border-blue-500 text-blue-700' 
                                  : course.courseType === 'art' 
                                    ? 'border-purple-500 text-purple-700' 
                                  : course.courseType === 'language' 
                                    ? 'border-green-500 text-green-700'
                                    : ''
                                }
                              >
                                {course.courseName}
                              </Badge>
                            ))}
                            {getStudentCourses(student.id).length === 0 && (
                              <span className="text-xs text-gray-500">Kursa kayıtlı değil</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudentsPage;