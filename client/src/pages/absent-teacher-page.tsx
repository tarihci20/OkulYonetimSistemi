import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, UserX, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar-tr';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import SubstitutionPanel from '@/components/substitution/substitution-panel';
import { cn } from '@/lib/utils';

// Schema for adding new absence
const absenceFormSchema = z.object({
  teacherId: z.string().min(1, "Öğretmen seçimi zorunludur"),
  reason: z.string().min(1, "Gelmeme nedeni girilmelidir"),
  date: z.date({
    required_error: "Tarih seçilmelidir",
  }),
});

type AbsenceFormValues = z.infer<typeof absenceFormSchema>;

const AbsentTeacherPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  
  // Error boundary
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Sayfa hatası yakalandı:", error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Fetch all absences
  const { data: absences, isLoading: absencesLoading } = useQuery({
    queryKey: ['/api/absences']
  });
  
  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers']
  });
  
  // Get today's absences safely
  const todayAbsences = React.useMemo(() => {
    // Veri kontrolü yapıyoruz
    if (!absences || !Array.isArray(absences)) return [];
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return absences.filter((absence: any) => {
        // Eksik veriler için kontrol
        if (!absence || !absence.startDate || !absence.endDate) {
          return false;
        }
        
        try {
          const startDate = new Date(absence.startDate);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(absence.endDate);
          endDate.setHours(23, 59, 59, 999);
          
          return today >= startDate && today <= endDate;
        } catch (err) {
          console.error("Tarih işleme hatası:", err);
          return false;
        }
      });
    } catch (err) {
      console.error("Yoklama işleme hatası:", err);
      return [];
    }
  }, [absences]);
  
  // Form for adding new absence
  const form = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: {
      teacherId: "",
      reason: "",
      date: new Date(),
    },
  });
  
  // Add absence mutation
  const addAbsenceMutation = useMutation({
    mutationFn: async (values: AbsenceFormValues) => {
      // Seçilen tarihe ait bir gün için başlangıç ve bitiş tarihleri oluştur
      const selectedDate = new Date(values.date);
      
      // Başlangıç tarihi, seçilen günün başlangıcı (00:00:00)
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Bitiş tarihi, seçilen günün sonu (23:59:59)
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      return await apiRequest("POST", "/api/absences", {
        teacherId: parseInt(values.teacherId),
        reason: values.reason,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Gelmeyen öğretmen eklendi",
        description: "Gelmeyen öğretmen bilgisi başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/absences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/absences/date/' + new Date().toISOString()] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Gelmeyen öğretmen eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: AbsenceFormValues) => {
    addAbsenceMutation.mutate(values);
  };
  
  if (hasError) {
    return (
      <DashboardLayout title="Gelmeyen Öğretmenler">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Bir sorun oluştu</h2>
          <p className="text-muted-foreground mt-2">Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (absencesLoading || teachersLoading) {
    return (
      <DashboardLayout title="Gelmeyen Öğretmenler">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-error border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Gelmeyen Öğretmenler">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <UserX className="mr-2 h-5 w-5 text-error" />
          Gelmeyen Öğretmenler
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-error hover:bg-error/90">
              <Plus className="mr-2 h-4 w-4" />
              Gelmeyen Öğretmen Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gelmeyen Öğretmen Ekle</DialogTitle>
              <DialogDescription>
                Gelmeyen öğretmen ve tarihi seçin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          {Array.isArray(teachers) ? teachers.map((teacher: any) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.name} {teacher.surname} ({teacher.branch})
                            </SelectItem>
                          )) : (
                            <SelectItem value="error">Öğretmen verileri yüklenemedi</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İzin Nedeni</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="İzin nedeni giriniz"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tarih</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                    disabled={addAbsenceMutation.isPending}
                  >
                    {addAbsenceMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Kaydediliyor...
                      </>
                    ) : (
                      "Kaydet"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserX className="mr-2 h-5 w-5" />
            <span>Bugün Gelmeyen Öğretmenler</span>
          </CardTitle>
          <CardDescription>
            Bugün için gelmeyen öğretmenler ve dersleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(todayAbsences) && todayAbsences.length > 0 ? (
              todayAbsences.map((absence: any) => {
                // Kontrol ediyoruz
                if (!absence || !absence.id || !absence.teacher) {
                  return null;
                }
                
                return (
                  <div 
                    key={absence.id} 
                    className="p-4 border rounded-md bg-error/5 border-error/20"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center mr-3">
                        <UserX className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{absence.teacher.fullName || `${absence.teacher.name || ''} ${absence.teacher.surname || ''}`}</h3>
                        <p className="text-sm text-muted-foreground">{absence.teacher.branch || ''}</p>
                      </div>
                      
                      <div className="ml-auto text-sm">
                        <p className="text-muted-foreground">Gelmeme Nedeni: {absence.reason || "Belirtilmemiş"}</p>
                        <p className="text-muted-foreground">
                          {absence.startDate ? format(new Date(absence.startDate), "dd MMMM yyyy", { locale: tr }) : "Tarih belirtilmemiş"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Bugün gelmeyen öğretmen bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Yerine Görevlendirme Yönetimi</span>
          </CardTitle>
          <CardDescription>
            Gelmeyen öğretmenlerin yerine görevlendirme yapabilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubstitutionPanel />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AbsentTeacherPage;
