import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  ClipboardList, 
  User, 
  MapPin, 
  CalendarClock, 
  Filter, 
  Plus,
  Trash,
  Edit,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { getTurkishDayName } from '@/lib/utils';
import DutyCalendar from '@/components/duty/duty-calendar';
import DutyTeacherList from '@/components/duty/duty-teacher-list';

interface Teacher {
  id: number;
  name: string;
  surname: string;
  fullName: string;
  branch: string;
}

interface DutyLocation {
  id: number;
  name: string;
}

interface Duty {
  id: number;
  teacherId: number;
  locationId: number;
  dayOfWeek: number;
  notes?: string;
  teacher?: Teacher;
  location?: DutyLocation;
}

interface EnhancedDuty extends Duty {
  teacher: Teacher;
  location: DutyLocation;
  period?: {
    id: number;
    order: number;
    startTime: string;
    endTime: string;
  };
}

const DutyManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const { getDayOfWeek, formattedDate } = useTurkishDate();
  const currentDayOfWeek = getDayOfWeek() === 0 ? 7 : getDayOfWeek();
  
  // Dialog states
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isDutyDialogOpen, setIsDutyDialogOpen] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingDuty, setIsEditingDuty] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<DutyLocation | null>(null);
  const [currentDuty, setCurrentDuty] = useState<Duty | null>(null);
  
  // Form data
  const [locationFormData, setLocationFormData] = useState({
    name: '',
  });
  
  const [dutyFormData, setDutyFormData] = useState({
    teacherId: '',
    locationId: '',
    dayOfWeek: '',
    notes: '',
  });
  
  // Fetch all duty assignments
  const { data: duties, isLoading: dutiesLoading } = useQuery<EnhancedDuty[]>({
    queryKey: ['/api/enhanced/duties']
  });
  
  // Fetch all duty locations
  const { data: locations, isLoading: locationsLoading } = useQuery<DutyLocation[]>({
    queryKey: ['/api/duty-locations']
  });
  
  // Fetch all teachers for the duty assignment form
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers']
  });
  
  // Nöbet Yeri Ekleme/Güncelleme mutation
  const locationMutation = useMutation({
    mutationFn: async (data: Partial<DutyLocation>) => {
      const url = isEditingLocation && currentLocation 
        ? `/api/duty-locations/${currentLocation.id}` 
        : '/api/duty-locations';
      const method = isEditingLocation ? 'PATCH' : 'POST';
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/duty-locations'] });
      // Diyaloğu kapat
      setIsLocationDialogOpen(false);
      // Formu sıfırla
      resetLocationForm();
      
      toast({
        title: isEditingLocation ? "Nöbet yeri güncellendi" : "Yeni nöbet yeri eklendi",
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
  
  // Nöbet Görevi Ekleme/Güncelleme mutation
  const dutyMutation = useMutation({
    mutationFn: async (data: Partial<Duty>) => {
      const url = isEditingDuty && currentDuty 
        ? `/api/duties/${currentDuty.id}` 
        : '/api/duties';
      const method = isEditingDuty ? 'PATCH' : 'POST';
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/duties'] });
      // Diyaloğu kapat
      setIsDutyDialogOpen(false);
      // Formu sıfırla
      resetDutyForm();
      
      toast({
        title: isEditingDuty ? "Nöbet görevi güncellendi" : "Yeni nöbet görevi eklendi",
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
  
  // Nöbet Yeri Silme mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/duty-locations/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/duty-locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/duties'] });
      
      toast({
        title: "Nöbet yeri silindi",
        description: "Silme işlemi başarıyla tamamlandı.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Silme hatası",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Nöbet Görevi Silme mutation
  const deleteDutyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/duties/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced/duties'] });
      
      toast({
        title: "Nöbet görevi silindi",
        description: "Silme işlemi başarıyla tamamlandı.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Silme hatası",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form fonksiyonları
  const handleEditLocation = (location: DutyLocation) => {
    setIsEditingLocation(true);
    setCurrentLocation(location);
    setLocationFormData({
      name: location.name,
    });
    setIsLocationDialogOpen(true);
  };
  
  const handleAddNewLocation = () => {
    setIsEditingLocation(false);
    setCurrentLocation(null);
    resetLocationForm();
    setIsLocationDialogOpen(true);
  };
  
  const handleDeleteLocation = (id: number) => {
    if (window.confirm('Bu nöbet yerini silmek istediğinize emin misiniz?')) {
      deleteLocationMutation.mutate(id);
    }
  };
  
  const handleEditDuty = (duty: Duty) => {
    setIsEditingDuty(true);
    setCurrentDuty(duty);
    setDutyFormData({
      teacherId: duty.teacherId.toString(),
      locationId: duty.locationId.toString(),
      dayOfWeek: duty.dayOfWeek.toString(),
      notes: duty.notes || '',
    });
    setIsDutyDialogOpen(true);
  };
  
  const handleAddNewDuty = () => {
    setIsEditingDuty(false);
    setCurrentDuty(null);
    resetDutyForm();
    setIsDutyDialogOpen(true);
  };
  
  const handleDeleteDuty = (id: number) => {
    if (window.confirm('Bu nöbet görevini silmek istediğinize emin misiniz?')) {
      deleteDutyMutation.mutate(id);
    }
  };
  
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationFormData.name.trim()) {
      toast({
        title: "Geçersiz form",
        description: "Lütfen bir nöbet yeri adı girin",
        variant: "destructive",
      });
      return;
    }
    
    locationMutation.mutate({
      name: locationFormData.name,
      ...(isEditingLocation && currentLocation ? { id: currentLocation.id } : {})
    });
  };
  
  const handleDutySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dutyFormData.teacherId || !dutyFormData.locationId || !dutyFormData.dayOfWeek) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen öğretmen, nöbet yeri ve gün bilgilerini doldurun",
        variant: "destructive",
      });
      return;
    }
    
    dutyMutation.mutate({
      teacherId: parseInt(dutyFormData.teacherId),
      locationId: parseInt(dutyFormData.locationId),
      dayOfWeek: parseInt(dutyFormData.dayOfWeek),
      notes: dutyFormData.notes || undefined,
      ...(isEditingDuty && currentDuty ? { id: currentDuty.id } : {})
    });
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFormData(prev => ({ ...prev, name: e.target.value }));
  };
  
  const handleDutyChange = (name: string, value: string) => {
    setDutyFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetLocationForm = () => {
    setLocationFormData({
      name: '',
    });
  };
  
  const resetDutyForm = () => {
    setDutyFormData({
      teacherId: '',
      locationId: '',
      dayOfWeek: '',
      notes: '',
    });
  };
  
  // Filter duties based on selected criteria
  const filteredDuties = React.useMemo(() => {
    if (!duties) return [];
    
    let filtered = [...duties];
    
    if (selectedDay) {
      filtered = filtered.filter(duty => duty.dayOfWeek.toString() === selectedDay);
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(duty => duty.location.id.toString() === selectedLocation);
    }
    
    return filtered;
  }, [duties, selectedDay, selectedLocation]);
  
  // Get today's duties
  const todayDuties = React.useMemo(() => {
    if (!duties) return [];
    
    return duties.filter(duty => duty.dayOfWeek === currentDayOfWeek);
  }, [duties, currentDayOfWeek]);
  
  if (dutiesLoading || locationsLoading || teachersLoading) {
    return (
      <DashboardLayout title="Nöbet Yönetimi">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-warning border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Nöbet Yönetimi">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            <span>Bugünkü Nöbetçiler</span>
          </CardTitle>
          <CardDescription>{formattedDate} - {getTurkishDayName(currentDayOfWeek)}</CardDescription>
        </CardHeader>
        <CardContent>
          <DutyTeacherList duties={todayDuties} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              <span>Nöbet Çizelgesi</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddNewLocation} variant="outline" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>Nöbet Yeri Ekle</span>
              </Button>
              <Button onClick={handleAddNewDuty} className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                <span>Nöbet Görevi Ekle</span>
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Öğretmenlerin nöbet yer ve zamanları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="day" className="mb-1 block">Gün</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Tüm günler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm günler</SelectItem>
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
            
            <div className="flex-1">
              <Label htmlFor="location" className="mb-1 block">Nöbet Yeri</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Tüm nöbet yerleri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm nöbet yerleri</SelectItem>
                  {locations && locations.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={() => {
                setSelectedDay('');
                setSelectedLocation('');
              }} className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Filtrele</span>
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="flex items-center">
                <ClipboardList className="mr-1 h-4 w-4" />
                <span>Liste</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center">
                <CalendarClock className="mr-1 h-4 w-4" />
                <span>Takvim</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gün</TableHead>
                      <TableHead>Nöbet Yeri</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead>Öğretmen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDuties.length > 0 ? (
                      filteredDuties
                        .sort((a, b) => {
                          // Sort by day, then by location
                          if (a.dayOfWeek !== b.dayOfWeek) {
                            return a.dayOfWeek - b.dayOfWeek;
                          }
                          return a.location.name.localeCompare(b.location.name);
                        })
                        .map(duty => (
                          <TableRow key={duty.id}>
                            <TableCell>{getTurkishDayName(duty.dayOfWeek)}</TableCell>
                            <TableCell>{duty.location.name}</TableCell>
                            <TableCell>
                              {duty.period 
                                ? `${duty.period.startTime} - ${duty.period.endTime} (${duty.period.order}. Ders)` 
                                : "Tüm Gün"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-warning bg-opacity-20 text-warning flex items-center justify-center mr-2">
                                  <User className="h-4 w-4" />
                                </div>
                                {duty.teacher.fullName}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nöbet kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar">
              <DutyCalendar duties={duties} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-xs text-muted-foreground">
              Toplam {filteredDuties.length} nöbet kaydı
            </span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Nöbet Yeri Ekleme/Düzenleme Diyaloğu */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingLocation ? "Nöbet Yeri Düzenle" : "Yeni Nöbet Yeri Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditingLocation 
                ? "Mevcut nöbet yerini güncelleyin" 
                : "Yeni bir nöbet yeri ekleyin"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLocationSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nöbet Yeri Adı</Label>
                <Input
                  id="name"
                  name="name"
                  value={locationFormData.name}
                  onChange={handleLocationChange}
                  required
                  placeholder="Ör: Bahçe, Koridor, Kantin"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsLocationDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" /> İptal
              </Button>
              <Button type="submit" disabled={locationMutation.isPending}>
                {locationMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isEditingLocation ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Nöbet Görevi Ekleme/Düzenleme Diyaloğu */}
      <Dialog open={isDutyDialogOpen} onOpenChange={setIsDutyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingDuty ? "Nöbet Görevi Düzenle" : "Yeni Nöbet Görevi Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditingDuty 
                ? "Mevcut nöbet görevi bilgilerini güncelleyin" 
                : "Yeni bir nöbet görevi için gerekli bilgileri girin"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDutySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="teacherId">Öğretmen</Label>
                <Select 
                  value={dutyFormData.teacherId} 
                  onValueChange={(value) => handleDutyChange('teacherId', value)}
                  required
                >
                  <SelectTrigger id="teacherId">
                    <SelectValue placeholder="Öğretmen seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers && teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.fullName} ({teacher.branch})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="locationId">Nöbet Yeri</Label>
                <Select 
                  value={dutyFormData.locationId} 
                  onValueChange={(value) => handleDutyChange('locationId', value)}
                  required
                >
                  <SelectTrigger id="locationId">
                    <SelectValue placeholder="Nöbet yeri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations && locations.map(location => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dayOfWeek">Gün</Label>
                <Select 
                  value={dutyFormData.dayOfWeek} 
                  onValueChange={(value) => handleDutyChange('dayOfWeek', value)}
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
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={dutyFormData.notes}
                  onChange={(e) => handleDutyChange('notes', e.target.value)}
                  placeholder="Ör: 11:55-12:10 arası teneffüs nöbeti"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDutyDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" /> İptal
              </Button>
              <Button type="submit" disabled={dutyMutation.isPending}>
                {dutyMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isEditingDuty ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DutyManagementPage;
