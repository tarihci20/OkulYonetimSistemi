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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Pencil, Trash, Upload, Filter, Search } from 'lucide-react';

// Öğrenci tipi
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  classId: number;
  className: string;
  studentNumber?: number;
  notes?: string;
  fullName: string;
}

// Sınıf tipi
interface Class {
  id: number;
  name: string;
}

const StudentManagementPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classId: '',
    studentNumber: '',
    notes: '',
  });
  
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
  
  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });
  
  // Student mutations
  const studentMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditingStudent && currentStudent 
        ? `/api/students/${currentStudent.id}` 
        : '/api/students';
      const method = isEditingStudent ? 'PATCH' : 'POST';
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Modalı kapat
      setIsAddDialogOpen(false);
      
      // Formu sıfırla
      resetForm();
      
      toast({
        title: isEditingStudent ? "Öğrenci güncellendi" : "Yeni öğrenci eklendi",
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
  
  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/students/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      toast({
        title: "Öğrenci silindi",
        description: "Öğrenci başarıyla silindi.",
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
  
  // Excel import mutation
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'İçe aktarma sırasında bir hata oluştu');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Verileri yenile
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Modalı kapat
      setIsImportDialogOpen(false);
      
      // Dosya seçimini sıfırla
      setImportFile(null);
      
      toast({
        title: "Excel içe aktarma tamamlandı",
        description: `${data.imported} öğrenci eklendi, ${data.updated} öğrenci güncellendi, ${data.skipped} öğrenci atlandı.`,
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
  
  const handleAddStudent = () => {
    setIsEditingStudent(false);
    setCurrentStudent(null);
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  const handleEditStudent = (student: Student) => {
    setIsEditingStudent(true);
    setCurrentStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      classId: student.classId.toString(),
      studentNumber: student.studentNumber?.toString() || '',
      notes: student.notes || '',
    });
    setIsAddDialogOpen(true);
  };
  
  const handleDeleteStudent = (id: number) => {
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      classId: '',
      studentNumber: '',
      notes: '',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.firstName || !formData.lastName || !formData.classId) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    // API'ye gönderilecek veriyi oluştur
    const studentData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      classId: parseInt(formData.classId),
      studentNumber: formData.studentNumber ? parseInt(formData.studentNumber) : null,
      notes: formData.notes || null,
    };
    
    // Mutation'ı çalıştır
    studentMutation.mutate(studentData);
  };
  
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!importFile) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen bir Excel dosyası seçin.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    importMutation.mutate(formData);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // Filtreleme
  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    
    let filtered = [...students];
    
    // Sınıf filtreleme
    if (selectedClass && selectedClass !== 'all') {
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
    
    return filtered;
  }, [students, selectedClass, searchQuery]);
  
  // Bir sınıftaki öğrenci sayısını hesapla
  const getStudentCountByClass = (classId: number) => {
    if (!students) return 0;
    return students.filter(student => student.classId === classId).length;
  };
  
  // Yükleniyor durumu
  if (studentsLoading || classesLoading) {
    return (
      <DashboardLayout title="Öğrenci Yönetimi">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Öğrenci Yönetimi">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                <span>Öğrenci Yönetimi</span>
              </CardTitle>
              <CardDescription>
                Okuldaki tüm öğrencilerin listesi ve yönetimi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Excel İçe Aktar
              </Button>
              <Button onClick={handleAddStudent}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Öğrenci Ekle
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
                      {c.name} ({getStudentCountByClass(c.id)} öğrenci)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Öğrenci Adı</TableHead>
                  <TableHead>Sınıf</TableHead>
                  <TableHead>Okul No</TableHead>
                  <TableHead>Notlar</TableHead>
                  <TableHead className="text-right w-28">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>{student.fullName || `${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{student.studentNumber || '-'}</TableCell>
                      <TableCell>{student.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStudent(student)}
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStudent(student.id)}
                            title="Sil"
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Öğrenci kaydı bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-xs text-muted-foreground">
              Toplam {filteredStudents.length} öğrenci
            </span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Öğrenci Ekleme/Düzenleme Modalı */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingStudent ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditingStudent 
                ? "Öğrenci bilgilerini güncelleyin" 
                : "Yeni bir öğrenci eklemek için gerekli bilgileri doldurun"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Adı *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Soyadı *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="classId">Sınıf *</Label>
                  <Select 
                    value={formData.classId} 
                    onValueChange={(value) => handleChange('classId', value)}
                    required
                  >
                    <SelectTrigger id="classId">
                      <SelectValue placeholder="Sınıf seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes && classes.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentNumber">Okul Numarası</Label>
                  <Input
                    id="studentNumber"
                    type="number"
                    value={formData.studentNumber}
                    onChange={(e) => handleChange('studentNumber', e.target.value)}
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
                onClick={() => setIsAddDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={studentMutation.isPending}
              >
                {studentMutation.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                )}
                {isEditingStudent ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Excel İçe Aktarma Modalı */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excel İçe Aktar</DialogTitle>
            <DialogDescription>
              Excel dosyasını seçin ve içe aktarın. Sütunlar şu sırada olmalıdır: Sınıf, Okul No, Adı Soyadı.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleImportSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Excel Dosyası</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Not: Excel dosyası ilk satırında başlıklar olacak şekilde olmalıdır.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={importMutation.isPending}
              >
                {importMutation.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                )}
                İçe Aktar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentManagementPage;