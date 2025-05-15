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
import { CalendarDays, CalendarRange, Plus, School, User, Trash, AlertTriangle } from 'lucide-react';

// Ders programı formunu doğrulama şeması
const scheduleFormSchema = z.object({
  classId: z.string().min(1, "Sınıf seçmeniz gerekiyor"),
  teacherIds: z.array(z.string()).min(1, "En az bir öğretmen seçmeniz gerekiyor"),
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
      teacherIds: [],
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
        teacherIds: [],
        subjectId: "",
        periodId: "",
        dayOfWeek: "1",
      });
    }
  }, [isDialogOpen, form]);

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      const { teacherIds, ...restValues } = values;
      
      // Birden fazla öğretmen için toplu işlem
      const createPromises = teacherIds.map(async (teacherId) => {
        const transformedValues = {
          classId: parseInt(restValues.classId, 10),
          teacherId: parseInt(teacherId, 10),
          subjectId: parseInt(restValues.subjectId, 10),
          periodId: parseInt(restValues.periodId, 10),
          dayOfWeek: parseInt(restValues.dayOfWeek, 10),
        };
        return await apiRequest("POST", "/api/schedules", transformedValues);
      });
      
      return await Promise.all(createPromises);
    },
    onSuccess: (_, variables) => {
      const teacherCount = variables.teacherIds.length;
      toast({
        title: "Ders programı eklendi",
        description: `${teacherCount} öğretmen ile ders programı başarıyla kaydedildi.`,
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
  
  // Tüm programı silme mutasyonu
  const deleteAllSchedulesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/schedules/all', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Tüm programı silme işlemi sırasında bir hata oluştu');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Verileri yenile
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/schedules'] });
      
      toast({
        title: "Tüm program silindi",
        description: "Tüm ders programı başarıyla silindi.",
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
          // Dönem order (sıra) özelliğini kullan
          periodMap.set(p.order.toString().toUpperCase(), p.id);
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
        const ogretmenler = row[colIndexes.ogretmen]?.toString().toUpperCase();
        const dersAdi = row[colIndexes.ders]?.toString().toUpperCase();
        const gunAdi = row[colIndexes.gun]?.toString();
        const saatAdi = row[colIndexes.saat]?.toString().toUpperCase();
        
        if (!sinifAdi || !ogretmenler || !dersAdi || !gunAdi || !saatAdi) {
          errorCount++;
          errors.push(`Satır ${i+2}: Eksik veri`);
          continue;
        }
        
        const classId = classMap.get(sinifAdi);
        const subjectId = subjectMap.get(dersAdi);
        const periodId = periodMap.get(saatAdi);
        const dayOfWeek = dayMap.get(gunAdi);
        
        if (!classId) {
          errorCount++;
          errors.push(`Satır ${i+2}: Sınıf bulunamadı: ${sinifAdi}`);
          continue;
        }
        
        // Öğretmen listesini noktalı virgüle göre bölelim
        const ogretmenListesi = ogretmenler.split(';').map((o: string) => o.trim());
        const teacherIds: number[] = [];
        
        let missingTeachers = false;
        
        // Her öğretmen için ID bul
        for (const ogretmenAdi of ogretmenListesi) {
          if (!ogretmenAdi) continue; // Boş isim atlama
          
          const teacherId = teacherMap.get(ogretmenAdi);
          if (!teacherId) {
            errorCount++;
            errors.push(`Satır ${i+2}: Öğretmen bulunamadı: ${ogretmenAdi}`);
            missingTeachers = true;
            break;
          }
          teacherIds.push(teacherId);
        }
        
        if (missingTeachers) continue; // Eksik öğretmen varsa bu satırı atla
        
        if (teacherIds.length === 0) {
          errorCount++;
          errors.push(`Satır ${i+2}: Hiç öğretmen bulunamadı.`);
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
          // Tüm öğretmenler için ders programı ekle
          for (const teacherId of teacherIds) {
            await apiRequest("POST", "/api/schedules", {
              classId,
              teacherId,
              subjectId,
              periodId,
              dayOfWeek
            });
            successCount++;
          }
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
          <Button 
            variant="destructive" 
            onClick={() => {
              if (window.confirm('Tüm ders programını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                deleteAllSchedulesMutation.mutate();
              }
            }}
            disabled={deleteAllSchedulesMutation.isPending}
          >
            <Trash className="mr-2 h-4 w-4" />
            {deleteAllSchedulesMutation.isPending ? 'Siliniyor...' : 'Tüm Programı Sil'}
          </Button>
          
          {/* Excel Yükleme Diyaloğu */}
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
                  Dosyanızda şu sütunlar olmalı: Sınıf, Öğretmen, Ders, Gün, Saat.
                  <br /><br />
                  <span className="font-medium">Aynı derse birden fazla öğretmen eklemek için:</span> "Öğretmen" sütununda isimleri noktalı virgül (;) ile ayırın. 
                  <br />
                  <span className="text-sm text-gray-600">Örnek: AYŞE YILMAZ; MEHMET KOÇ; ALİ ÖZTÜRK</span>
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
          
          {/* Ders Ekleme Diyaloğu */}
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
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sınıf seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes?.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name}
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
                    name="teacherIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Öğretmenler</FormLabel>
                        <div className="space-y-4">
                          {field.value?.map((teacherId, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <Select 
                                onValueChange={(value) => {
                                  const newValues = [...field.value];
                                  newValues[index] = value;
                                  field.onChange(newValues);
                                }}
                                value={teacherId}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Öğretmen seçin" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teachers?.map((t) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                      {t.name} {t.surname} ({t.branch})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0 h-9 w-9"
                                onClick={() => {
                                  const newValues = [...field.value];
                                  newValues.splice(index, 1);
                                  field.onChange(newValues);
                                }}
                              >
                                <span className="sr-only">Sil</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          ))}
                          
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => field.onChange([...field.value || [], ""])}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            Öğretmen Ekle
                          </Button>
                        </div>
                        {field.value?.length === 0 && (
                          <p className="text-sm text-red-500 mt-2">En az bir öğretmen seçmeniz gerekiyor</p>
                        )}
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
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ders seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects?.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name}
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
                            value={field.value || ""}
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
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Ders saati seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {periods?.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.order}. Ders ({p.startTime}-{p.endTime})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
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
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gün Seçin</label>
            <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Gün Seçin" />
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

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList>
              <TabsTrigger value="classes">Sınıflar</TabsTrigger>
              <TabsTrigger value="teachers">Öğretmenler</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="mt-4">
              <label className="block text-sm font-medium mb-1">Sınıf Seçin</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Sınıf Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="teachers" className="mt-4">
              <label className="block text-sm font-medium mb-1">Öğretmen Seçin</label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Öğretmen Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name} {t.surname} ({t.branch})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ders Programı</CardTitle>
          <CardDescription>
            {selectedTab === "classes" && selectedClassId
              ? `${classes?.find(c => c.id.toString() === selectedClassId)?.name} Sınıfı - ${getDayName(parseInt(selectedDayOfWeek, 10))} Programı`
              : selectedTab === "teachers" && selectedTeacherId
              ? `${teachers?.find(t => t.id.toString() === selectedTeacherId)?.name} ${teachers?.find(t => t.id.toString() === selectedTeacherId)?.surname} - ${getDayName(parseInt(selectedDayOfWeek, 10))} Programı`
              : "Sınıf veya öğretmen seçin"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTab === "classes" && selectedClassId ? (
            sortedSchedules.length > 0 ? (
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
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Düzenleme fonksiyonu (şimdilik boş)
                                toast({
                                  title: "Bilgi",
                                  description: "Düzenleme özelliği yakında eklenecek"
                                });
                              }}
                            >
                              Düzenle
                            </Button>
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border">
                <School className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Ders programı bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Seçilen sınıf ve gün için ders programı henüz oluşturulmamış.
                </p>
                <div className="mt-6">
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ders Ekle
                  </Button>
                </div>
              </div>
            )
          ) : selectedTab === "teachers" && selectedTeacherId ? (
            sortedSchedules.length > 0 ? (
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
                        <td className="px-4 py-3 text-sm">
                          {schedule.class.name}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {schedule.subject.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Bilgi",
                                  description: "Düzenleme özelliği yakında eklenecek"
                                });
                              }}
                            >
                              Düzenle
                            </Button>
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Ders programı bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Seçilen öğretmen ve gün için ders programı henüz oluşturulmamış.
                </p>
                <div className="mt-6">
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ders Ekle
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border">
              <h3 className="mt-2 text-sm font-medium text-gray-900">Görüntülemek için sınıf veya öğretmen seçin</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ders programını görüntülemek için yukarıdan bir sınıf veya öğretmen seçin.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManagement;