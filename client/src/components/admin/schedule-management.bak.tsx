import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CalendarDays, CalendarRange, Plus, School, User } from 'lucide-react';

// Ders programı formunu doğrulama şeması
const scheduleFormSchema = z.object({
  classId: z.string().min(1, "Sınıf seçmeniz gerekiyor"),
  teacherId: z.string().min(1, "Öğretmen seçmeniz gerekiyor"),
  subjectId: z.string().min(1, "Ders seçmeniz gerekiyor"),
  periodId: z.string().min(1, "Ders saati seçmeniz gerekiyor"),
  dayOfWeek: z.string().min(1, "Gün seçmeniz gerekiyor"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Türkçe gün isimleri
const DAYS_OF_WEEK = [
  { value: "1", label: "Pazartesi" },
  { value: "2", label: "Salı" },
  { value: "3", label: "Çarşamba" },
  { value: "4", label: "Perşembe" },
  { value: "5", label: "Cuma" },
  { value: "6", label: "Cumartesi" },
  { value: "7", label: "Pazar" },
];

// Tipleri tanımla
interface Teacher {
  id: number;
  name: string;
  surname: string;
  branch: string;
  fullName?: string; 
}

interface Class {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Period {
  id: number;
  order: number;
  startTime: string;
  endTime: string;
}

interface Schedule {
  id: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  periodId: number;
  dayOfWeek: number;
}

interface ScheduleWithDetails {
  id: number;
  teacher: Teacher;
  class: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
  };
  period: {
    id: number;
    order: number;
    startTime: string;
    endTime: string;
  };
  dayOfWeek: number;
}

const ScheduleManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExcelDialogOpen, setIsExcelDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("classes");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>("1"); // Pazartesi varsayılan
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Get data
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers']
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['/api/classes']
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects']
  });

  const { data: periods } = useQuery<Period[]>({
    queryKey: ['/api/periods']
  });

  const { data: schedules } = useQuery<ScheduleWithDetails[]>({
    queryKey: ['/api/enhanced/schedules']
  });

  // Form setup
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      classId: "",
      teacherId: "",
      subjectId: "",
      periodId: "",
      dayOfWeek: "1",
    },
  });

  // Reset form when opening dialog
  useEffect(() => {
    if (isDialogOpen) {
      form.reset({
        classId: "",
        teacherId: "",
        subjectId: "",
        periodId: "",
        dayOfWeek: "1",
      });
    }
  }, [isDialogOpen, form]);

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      // Dizeleri sayılara dönüştür
      const transformedValues = {
        classId: parseInt(values.classId, 10),
        teacherId: parseInt(values.teacherId, 10),
        subjectId: parseInt(values.subjectId, 10),
        periodId: parseInt(values.periodId, 10),
        dayOfWeek: parseInt(values.dayOfWeek, 10),
      };
      return await apiRequest("POST", "/api/schedules", transformedValues);
    },
    onSuccess: () => {
      toast({
        title: "Ders programı eklendi",
        description: "Ders programı başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/schedules'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders programı eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Ders programı silindi",
        description: "Ders programı başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/schedules'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders programı silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Excel işlemleri
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setExcelFile(file);
      
      // Excel dosyasını oku
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target && evt.target.result) {
          try {
            const data = new Uint8Array(evt.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // İlk sayfayı al
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // JSON'a dönüştür
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            setExcelData(jsonData);
            
            // Önizleme için ilk 5 satırı al (başlık satırı dahil)
            setExcelPreview(jsonData.slice(0, 6));
            
            toast({
              title: "Excel dosyası yüklendi",
              description: `${jsonData.length} satır başarıyla okundu.`,
            });
          } catch (error) {
            toast({
              title: "Hata",
              description: "Excel dosyası okunamadı. Geçerli bir Excel dosyası olduğundan emin olun.",
              variant: "destructive",
            });
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  // Excel verilerini işle ve programa ekle
  const processExcelData = async () => {
    if (!excelData || excelData.length <= 1) {
      toast({
        title: "Hata",
        description: "İşlenecek veri bulunamadı veya sadece başlık satırı var.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsImporting(true);
      setImportProgress(0);
      
      // Başlıklar ilk satırda olmalı
      const headers = excelData[0] as string[];
      const dataRows = excelData.slice(1) as any[];
      
      // Gerekli sütunları kontrol et (örnek: Sınıf, Öğretmen, Ders, Gün, Saat sütunları gerekli)
      const requiredColumns = ["Sınıf", "Öğretmen", "Ders", "Gün", "Saat"];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        toast({
          title: "Excel formatı uygun değil",
          description: `Aşağıdaki sütunlar eksik: ${missingColumns.join(", ")}`,
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }
      
      // Sütun indexlerini bul
      const colIndexes = {
        sinif: headers.indexOf("Sınıf"),
        ogretmen: headers.indexOf("Öğretmen"),
        ders: headers.indexOf("Ders"),
        gun: headers.indexOf("Gün"),
        saat: headers.indexOf("Saat")
      };
      
      // Öğretmen, sınıf ve ders eşleştirmesi için kullanılacak haritalar
      const teacherMap = new Map<string, number>();
      const classMap = new Map<string, number>();
      const subjectMap = new Map<string, number>();
      const periodMap = new Map<string, number>();
      const dayMap = new Map<string, number>([
        ["Pazartesi", 1], 
        ["Salı", 2], 
        ["Çarşamba", 3], 
        ["Perşembe", 4], 
        ["Cuma", 5]
      ]);
      
      // Verileri haritala
      if (teachers) {
        teachers.forEach(t => {
          const fullName = `${t.name} ${t.surname}`;
          teacherMap.set(fullName.toUpperCase(), t.id);
        });
      }
      
      if (classes) {
        classes.forEach(c => {
          classMap.set(c.name.toUpperCase(), c.id);
        });
      }
      
      if (subjects) {
        subjects.forEach(s => {
          subjectMap.set(s.name.toUpperCase(), s.id);
        });
      }
      
      if (periods) {
        periods.forEach(p => {
          // Dönem kimliğini ve sırasını kullan (ör: "1" veya "1. Ders")
          periodMap.set(p.order.toString().toUpperCase(), p.id);
          // Not: period nesnesinde adı veya açıklaması varsa ona göre düzenleme yapılabilir
        });
      }
      
      // Başarılı ve başarısız işlemleri takip et
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Satırları işle
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;
        
        const sinifAdi = row[colIndexes.sinif]?.toString().toUpperCase();
        const ogretmenAdi = row[colIndexes.ogretmen]?.toString().toUpperCase();
        const dersAdi = row[colIndexes.ders]?.toString().toUpperCase();
        const gunAdi = row[colIndexes.gun]?.toString();
        const saatAdi = row[colIndexes.saat]?.toString().toUpperCase();
        
        if (!sinifAdi || !ogretmenAdi || !dersAdi || !gunAdi || !saatAdi) {
          errorCount++;
          errors.push(`Satır ${i+2}: Eksik veri`);
          continue;
        }
        
        const classId = classMap.get(sinifAdi);
        const teacherId = teacherMap.get(ogretmenAdi);
        const subjectId = subjectMap.get(dersAdi);
        const periodId = periodMap.get(saatAdi);
        const dayOfWeek = dayMap.get(gunAdi);
        
        if (!classId) {
          errorCount++;
          errors.push(`Satır ${i+2}: Sınıf bulunamadı: ${sinifAdi}`);
          continue;
        }
        
        if (!teacherId) {
          errorCount++;
          errors.push(`Satır ${i+2}: Öğretmen bulunamadı: ${ogretmenAdi}`);
          continue;
        }
        
        if (!subjectId) {
          errorCount++;
          errors.push(`Satır ${i+2}: Ders bulunamadı: ${dersAdi}`);
          continue;
        }
        
        if (!periodId) {
          errorCount++;
          errors.push(`Satır ${i+2}: Saat bulunamadı: ${saatAdi}`);
          continue;
        }
        
        if (!dayOfWeek) {
          errorCount++;
          errors.push(`Satır ${i+2}: Geçersiz gün: ${gunAdi}. (Pazartesi, Salı, Çarşamba, Perşembe, Cuma olmalı)`);
          continue;
        }
        
        try {
          // Mevcut çakışma kontrolü yapılabilir
          
          // Dersi ekle
          await apiRequest("POST", "/api/schedules", {
            classId,
            teacherId,
            subjectId,
            periodId,
            dayOfWeek
          });
          
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Satır ${i+2}: API hatası: ${(error as Error).message}`);
        }
        
        // İlerleme durumunu güncelle
        setImportProgress(Math.round(((i + 1) / dataRows.length) * 100));
      }
      
      // İşlem sonuçlarını göster
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/schedules'] });
      
      toast({
        title: "Excel import tamamlandı",
        description: `${successCount} ders başarıyla eklendi. ${errorCount} hatalı satır.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
      
      if (errors.length > 0) {
        console.error("Excel import hataları:", errors);
      }
      
      setIsExcelDialogOpen(false);
      setExcelFile(null);
      setExcelData([]);
      setExcelPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast({
        title: "Excel import hatası",
        description: `İşlem sırasında beklenmeyen bir hata oluştu: ${(error as Error).message}`,
        variant: "destructive",
      });
      console.error("Excel import hatası:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Form submit handler
  const onSubmit = (values: ScheduleFormValues) => {
    createScheduleMutation.mutate(values);
  };

  // Sınıf veya öğretmene göre ders programını filtreleme
  const filteredSchedules = React.useMemo(() => {
    if (!schedules) return [];

    // Gün filtrelemesi
    let filtered = schedules;
    if (selectedDayOfWeek) {
      filtered = filtered.filter(
        (schedule) => schedule.dayOfWeek === parseInt(selectedDayOfWeek, 10)
      );
    }

    // Sınıf veya öğretmen filtrelemesi
    if (selectedTab === "classes" && selectedClassId) {
      filtered = filtered.filter(
        (schedule) => schedule.class.id === parseInt(selectedClassId, 10)
      );
    } else if (selectedTab === "teachers" && selectedTeacherId) {
      filtered = filtered.filter(
        (schedule) => schedule.teacher.id === parseInt(selectedTeacherId, 10)
      );
    }

    return filtered;
  }, [schedules, selectedTab, selectedClassId, selectedTeacherId, selectedDayOfWeek]);

  // Sırala: ders saatlerine göre
  const sortedSchedules = React.useMemo(() => {
    return [...filteredSchedules].sort((a, b) => a.period.order - b.period.order);
  }, [filteredSchedules]);

  // Öğretmen adını tam olarak göster
  const getTeacherFullName = (teacher: Teacher) => {
    return teacher.fullName || `${teacher.name} ${teacher.surname}`;
  };

  // Gün adını al
  const getDayName = (dayOfWeek: number) => {
    const day = DAYS_OF_WEEK.find(d => parseInt(d.value, 10) === dayOfWeek);
    return day ? day.label : "Bilinmeyen Gün";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium flex items-center">
          <CalendarRange className="mr-2 h-5 w-5" />
          Ders Programı Yönetimi
        </h2>
        
        <div className="flex gap-2">
          <Dialog open={isExcelDialogOpen} onOpenChange={setIsExcelDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <CalendarRange className="mr-2 h-4 w-4" />
                Excel'den Yükle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Excel'den Ders Programı Yükle</DialogTitle>
                <DialogDescription>
                  Toplu olarak ders programı eklemek için Excel dosyası yükleyin.
                  Dosyanızda şu sütunlar olmalı: Sınıf, Öğretmen, Ders, Gün, Saat
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    onChange={handleExcelFileChange}
                  />
                </div>
                
                {excelFile && excelPreview.length > 0 && (
                  <div className="border rounded-md p-4 bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">Önizleme (İlk 5 satır):</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            {excelPreview[0].map((header: string, idx: number) => (
                              <th 
                                key={idx}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {excelPreview.slice(1).map((row: any, rowIdx: number) => (
                            <tr key={rowIdx}>
                              {row.map((cell: any, cellIdx: number) => (
                                <td key={cellIdx} className="px-3 py-2 whitespace-nowrap text-gray-600">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {isImporting && (
                  <div className="mt-2">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-center mt-1 text-gray-500">
                      İşleniyor... {importProgress}%
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsExcelDialogOpen(false);
                    setExcelFile(null);
                    setExcelData([]);
                    setExcelPreview([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  İptal
                </Button>
                <Button 
                  onClick={processExcelData}
                  disabled={!excelFile || excelData.length === 0 || isImporting}
                >
                  {isImporting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      İşleniyor...
                    </>
                  ) : "Excel'den Yükle"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Programa Ders Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ders Programına Yeni Ders Ekle</DialogTitle>
              <DialogDescription>
                Sınıf, öğretmen, ders ve zaman bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sınıf</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sınıf seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id.toString()}>
                              {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Öğretmen</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Öğretmen seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers?.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {getTeacherFullName(teacher)} ({teacher.branch})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ders</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ders seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gün</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Gün seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="periodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ders Saati</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ders saati seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {periods?.map((period) => (
                              <SelectItem key={period.id} value={period.id.toString()}>
                                {period.order}. Ders ({period.startTime}-{period.endTime})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createScheduleMutation.isPending}
                  >
                    {createScheduleMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Kaydediliyor...
                      </>
                    ) : "Kaydet"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ders Programı Görüntüle</CardTitle>
          <CardDescription>
            Sınıflara veya öğretmenlere göre ders programlarını görüntüleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="classes" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="classes" className="flex items-center">
                <School className="h-4 w-4 mr-2" />
                Sınıflar
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Öğretmenler
              </TabsTrigger>
            </TabsList>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                {selectedTab === "classes" ? (
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sınıf seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {getTeacherFullName(teacher)} ({teacher.branch})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div>
                <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="classes">
              {selectedClassId ? (
                <div className="space-y-4">
                  <h3 className="text-md font-medium mb-2">
                    {classes?.find(c => c.id.toString() === selectedClassId)?.name} Sınıfı - {getDayName(parseInt(selectedDayOfWeek, 10))} Programı
                  </h3>
                  
                  {sortedSchedules.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Saat</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Ders</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Öğretmen</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSchedules.map((schedule) => (
                            <tr key={schedule.id} className="border-b">
                              <td className="px-4 py-3 text-sm">
                                {schedule.period.order}. Ders<br />
                                <span className="text-xs text-gray-500">
                                  {schedule.period.startTime} - {schedule.period.endTime}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {schedule.subject.name}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {getTeacherFullName(schedule.teacher)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Bu dersi programdan silmek istediğinize emin misiniz?")) {
                                      deleteScheduleMutation.mutate(schedule.id);
                                    }
                                  }}
                                >
                                  Sil
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Ders programı bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Seçilen sınıf ve gün için ders programı henüz oluşturulmamış
                      </p>
                      <div className="mt-6">
                        <Button 
                          variant="default" 
                          onClick={() => setIsDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ders Programına Ekle
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border">
                  <School className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sınıf seçilmedi</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ders programını görüntülemek için lütfen bir sınıf seçin
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="teachers">
              {selectedTeacherId ? (
                <div className="space-y-4">
                  <h3 className="text-md font-medium mb-2">
                    {teachers?.find(t => t.id.toString() === selectedTeacherId)?.name} {teachers?.find(t => t.id.toString() === selectedTeacherId)?.surname} - {getDayName(parseInt(selectedDayOfWeek, 10))} Programı
                  </h3>
                  
                  {sortedSchedules.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Saat</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Sınıf</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Ders</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSchedules.map((schedule) => (
                            <tr key={schedule.id} className="border-b">
                              <td className="px-4 py-3 text-sm">
                                {schedule.period.order}. Ders<br />
                                <span className="text-xs text-gray-500">
                                  {schedule.period.startTime} - {schedule.period.endTime}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {schedule.class.name}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {schedule.subject.name}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Bu dersi programdan silmek istediğinize emin misiniz?")) {
                                      deleteScheduleMutation.mutate(schedule.id);
                                    }
                                  }}
                                >
                                  Sil
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Ders programı bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Seçilen öğretmen ve gün için ders programı henüz oluşturulmamış
                      </p>
                      <div className="mt-6">
                        <Button 
                          variant="default" 
                          onClick={() => setIsDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ders Programına Ekle
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Öğretmen seçilmedi</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ders programını görüntülemek için lütfen bir öğretmen seçin
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManagement;