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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getTurkishDayName, formatTimeForDisplay } from '@/lib/utils';
import { Backpack, Plus, Pencil, Trash, Search, Filter, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

// Öğrenci kurs bilgisi tipi
interface StudentCourse {
  id: number;
  studentId: number;
  courseType: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Sınıf tipi
interface Class {
  id: number;
  name: string;
}

const StudentCoursePage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<StudentCourse | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    studentId: '',
    courseType: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  
  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
  
  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });
  
  // Fetch student courses
  const { data: studentCourses, isLoading: coursesLoading } = useQuery<StudentCourse[]>({
    queryKey: ['/api/student-courses'],
  });
  
  // Student course mutation
  const courseMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing && currentCourse 
        ? `/api/student-courses/${currentCourse.id}` 
        : '/api/student-courses';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'İşlem sırasında bir hata oluştu');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Verileri yenile
      queryClient.invalidateQueries({ queryKey: ['/api/student-courses'] });
      
      // Modalı kapat
      setIsDialogOpen(false);
      
      // Formu sıfırla
      resetForm();
      
      toast({
        title: isEditing ? "Kurs kaydı güncellendi" : "Yeni kurs kaydı eklendi",
        description: "İşlem başarıyla tamamlandı.",
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
  
  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/student-courses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Silme işlemi sırasında bir hata oluştu');
      }
      
      return id;
    },
    onSuccess: () => {
      // Verileri yenile
      queryClient.invalidateQueries({ queryKey: ['/api/student-courses'] });
      
      toast({
        title: "Kurs kaydı silindi",
        description: "Kurs kaydı başarıyla silindi.",
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
  
  // Form handlers
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddCourse = (studentId?: number) => {
    setIsEditing(false);
    setCurrentCourse(null);
    resetForm();
    
    if (studentId) {
      setFormData(prev => ({ ...prev, studentId: studentId.toString() }));
    }
    
    setIsDialogOpen(true);
  };
  
  const handleEditCourse = (course: StudentCourse) => {
    setIsEditing(true);
    setCurrentCourse(course);
    setFormData({
      studentId: course.studentId.toString(),
      courseType: course.courseType,
      dayOfWeek: course.dayOfWeek.toString(),
      startTime: course.startTime,
      endTime: course.endTime,
      notes: course.notes || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteCourse = (id: number) => {
    if (window.confirm('Bu kurs kaydını silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const resetForm = () => {
    setFormData({
      studentId: '',
      courseType: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      notes: '',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.studentId || !formData.courseType || !formData.dayOfWeek) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    // API'ye gönderilecek veriyi oluştur
    const courseData = {
      studentId: parseInt(formData.studentId),
      courseType: formData.courseType,
      dayOfWeek: parseInt(formData.dayOfWeek),
      startTime: formData.startTime || null,
      endTime: formData.endTime || null,
      notes: formData.notes || null,
    };
    
    // Mutation'ı çalıştır
    courseMutation.mutate(courseData);
  };
  
  // Filtreleme
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
    
    // Sınıf numarasına göre sırala
    return filtered.sort((a, b) => {
      // Önce sınıf adına göre sırala (5/A, 6/B, 7/C)
      const aClass = a.className.split('/')[0];
      const bClass = b.className.split('/')[0];
      
      if (aClass !== bClass) {
        return parseInt(aClass) - parseInt(bClass);
      }
      
      // Sonra aynı sınıf içinde öğrenci adına göre sırala
      return a.lastName.localeCompare(b.lastName);
    });
  }, [students, selectedClass, searchQuery]);
  
  // Öğrenciye göre kurs kayıtları
  const getStudentCourses = (studentId: number): StudentCourse[] => {
    if (!studentCourses) return [];
    
    return studentCourses.filter(course => course.studentId === studentId);
  };
  
  // Kurs türleri
  const courseTypes = [
    { value: 'sport', label: 'Spor Kursu' },
    { value: 'art', label: 'Sanat Kursu' },
    { value: 'language', label: 'Dil Kursu' },
  ];
  
  // Yükleniyor durumu
  if (studentsLoading || classesLoading || coursesLoading) {
    return (
      <DashboardLayout title="Öğrenci Kursları">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Öğrenci Kursları">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Backpack className="mr-2 h-5 w-5 text-primary" />
                <span>Öğrenci Kursları</span>
              </CardTitle>
              <CardDescription>
                Öğrencilerin katıldığı kursların yönetimi
              </CardDescription>
            </div>
            <Button onClick={() => handleAddCourse()}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kurs Kaydı Ekle
            </Button>
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
          </div>

          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="student">Öğrenci Görünümü</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Öğrenci</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead>Kurs Türü</TableHead>
                      <TableHead>Gün</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead>Notlar</TableHead>
                      <TableHead className="text-right w-20">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentCourses && students && studentCourses.length > 0 ? (
                      studentCourses.map((course, index) => {
                        const student = students.find(s => s.id === course.studentId);
                        if (!student) return null;
                        
                        // Sınıf filtrelemesi
                        if (selectedClass !== 'all' && student.classId.toString() !== selectedClass) {
                          return null;
                        }
                        
                        // Arama filtrelemesi
                        if (searchQuery && !(
                          student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.studentNumber?.toString() || '').includes(searchQuery)
                        )) {
                          return null;
                        }
                        
                        // Kurs türünün adını bul
                        const courseTypeLabel = courseTypes.find(t => t.value === course.courseType)?.label || course.courseType;
                        
                        return (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {student.fullName || `${student.firstName} ${student.lastName}`}
                            </TableCell>
                            <TableCell>{student.className}</TableCell>
                            <TableCell>{courseTypeLabel}</TableCell>
                            <TableCell>{getTurkishDayName(course.dayOfWeek)}</TableCell>
                            <TableCell>
                              {course.startTime && course.endTime
                                ? `${formatTimeForDisplay(course.startTime)} - ${formatTimeForDisplay(course.endTime)}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell>{course.notes || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCourse(course)}
                                  title="Düzenle"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCourse(course.id)}
                                  title="Sil"
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Kurs kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="student">
              <div className="space-y-6">
                {filteredStudents.map(student => {
                  const studentCourseList = getStudentCourses(student.id);
                  
                  return (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-lg flex items-center">
                          <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                          {student.fullName || `${student.firstName} ${student.lastName}`}
                          <Badge className="ml-2">{student.className}</Badge>
                        </h3>
                        <Button 
                          variant="outline" 
                          onClick={() => handleAddCourse(student.id)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Kurs Ekle
                        </Button>
                      </div>
                      
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">No</TableHead>
                              <TableHead>Kurs Türü</TableHead>
                              <TableHead>Gün</TableHead>
                              <TableHead>Saat</TableHead>
                              <TableHead>Notlar</TableHead>
                              <TableHead className="text-right w-20">İşlemler</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentCourseList.length > 0 ? (
                              studentCourseList.map((course, index) => {
                                // Kurs türünün adını bul
                                const courseTypeLabel = courseTypes.find(t => t.value === course.courseType)?.label || course.courseType;
                                
                                return (
                                  <TableRow key={course.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{courseTypeLabel}</TableCell>
                                    <TableCell>{getTurkishDayName(course.dayOfWeek)}</TableCell>
                                    <TableCell>
                                      {course.startTime && course.endTime
                                        ? `${formatTimeForDisplay(course.startTime)} - ${formatTimeForDisplay(course.endTime)}`
                                        : '-'
                                      }
                                    </TableCell>
                                    <TableCell>{course.notes || '-'}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditCourse(course)}
                                          title="Düzenle"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteCourse(course.id)}
                                          title="Sil"
                                        >
                                          <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-12 text-center">
                                  Bu öğrencinin kurs kaydı bulunmuyor
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
              Toplam {studentCourses?.length || 0} kurs kaydı
            </span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Kurs Ekleme/Düzenleme Modalı */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Kurs Kaydı Düzenle" : "Yeni Kurs Kaydı Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Kurs kaydı bilgilerini güncelleyin" 
                : "Yeni bir kurs kaydı için gerekli bilgileri doldurun"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="studentId">Öğrenci *</Label>
                <Select 
                  value={formData.studentId} 
                  onValueChange={(value) => handleChange('studentId', value)}
                  required
                >
                  <SelectTrigger id="studentId">
                    <SelectValue placeholder="Öğrenci seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {students && students.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.fullName || `${s.firstName} ${s.lastName}`} ({s.className})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="courseType">Kurs Türü *</Label>
                <Select 
                  value={formData.courseType} 
                  onValueChange={(value) => handleChange('courseType', value)}
                  required
                >
                  <SelectTrigger id="courseType">
                    <SelectValue placeholder="Kurs türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dayOfWeek">Gün *</Label>
                <Select 
                  value={formData.dayOfWeek} 
                  onValueChange={(value) => handleChange('dayOfWeek', value)}
                  required
                >
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue placeholder="Gün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pazartesi</SelectItem>
                    <SelectItem value="2">Salı</SelectItem>
                    <SelectItem value="3">Çarşamba</SelectItem>
                    <SelectItem value="4">Perşembe</SelectItem>
                    <SelectItem value="5">Cuma</SelectItem>
                    <SelectItem value="6">Cumartesi</SelectItem>
                    <SelectItem value="7">Pazar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Başlangıç Saati</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Bitiş Saati</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={courseMutation.isPending}
              >
                {courseMutation.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                )}
                {isEditing ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentCoursePage;