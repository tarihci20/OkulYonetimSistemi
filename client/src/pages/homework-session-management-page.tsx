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
import { BookOpen, Plus, Pencil, Trash, Clock, Calendar } from 'lucide-react';
import { getTurkishDayName, formatTimeForDisplay } from '@/lib/utils';

// Etüt programı tipi
interface HomeworkSession {
  id: number;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string;
}

const HomeworkSessionManagementPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState<HomeworkSession | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  
  // Fetch all homework sessions
  const { data: sessions, isLoading } = useQuery<HomeworkSession[]>({
    queryKey: ['/api/homework-sessions'],
  });
  
  // Session mutation
  const sessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing && currentSession 
        ? `/api/homework-sessions/${currentSession.id}` 
        : '/api/homework-sessions';
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
      queryClient.invalidateQueries({ queryKey: ['/api/homework-sessions'] });
      
      // Modalı kapat
      setIsDialogOpen(false);
      
      // Formu sıfırla
      resetForm();
      
      toast({
        title: isEditing ? "Etüt saati güncellendi" : "Yeni etüt saati eklendi",
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
  
  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/homework-sessions/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/homework-sessions'] });
      
      toast({
        title: "Etüt saati silindi",
        description: "Etüt saati başarıyla silindi.",
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
  
  const handleAddSession = () => {
    setIsEditing(false);
    setCurrentSession(null);
    resetForm();
    setIsDialogOpen(true);
  };
  
  const handleEditSession = (session: HomeworkSession) => {
    setIsEditing(true);
    setCurrentSession(session);
    setFormData({
      name: session.name,
      dayOfWeek: session.dayOfWeek.toString(),
      startTime: session.startTime,
      endTime: session.endTime,
      notes: session.notes || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteSession = (id: number) => {
    if (window.confirm('Bu etüt saatini silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      notes: '',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.name || !formData.dayOfWeek || !formData.startTime || !formData.endTime) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    // API'ye gönderilecek veriyi oluştur
    const sessionData = {
      name: formData.name,
      dayOfWeek: parseInt(formData.dayOfWeek),
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes || null,
    };
    
    // Mutation'ı çalıştır
    sessionMutation.mutate(sessionData);
  };
  
  // Günlere göre etüt programlarını grupla
  const groupedSessions = React.useMemo(() => {
    if (!sessions) return {};
    
    const grouped: Record<number, HomeworkSession[]> = {};
    
    // Günlere göre grupla
    for (let day = 1; day <= 7; day++) {
      grouped[day] = sessions.filter(session => session.dayOfWeek === day);
    }
    
    return grouped;
  }, [sessions]);
  
  // Yükleniyor durumu
  if (isLoading) {
    return (
      <DashboardLayout title="Etüt Programı Yönetimi">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Etüt Programı Yönetimi">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                <span>Etüt Programı Yönetimi</span>
              </CardTitle>
              <CardDescription>
                Ödev ve ders etüt saatlerinin düzenlenmesi
              </CardDescription>
            </div>
            <Button onClick={handleAddSession}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Etüt Saati Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Her gün için etüt programları */}
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-3 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                  {getTurkishDayName(day)}
                </h3>
                
                {groupedSessions[day] && groupedSessions[day].length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Etüt Adı</TableHead>
                          <TableHead>Başlangıç</TableHead>
                          <TableHead>Bitiş</TableHead>
                          <TableHead>Notlar</TableHead>
                          <TableHead className="text-right w-24">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedSessions[day]
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(session => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.name}</TableCell>
                              <TableCell>{formatTimeForDisplay(session.startTime)}</TableCell>
                              <TableCell>{formatTimeForDisplay(session.endTime)}</TableCell>
                              <TableCell>{session.notes || '-'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSession(session)}
                                    title="Düzenle"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSession(session.id)}
                                    title="Sil"
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Bu gün için etüt programı bulunmuyor
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-xs text-muted-foreground">
              Toplam {sessions?.length || 0} etüt saati
            </span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Etüt Saati Ekleme/Düzenleme Modalı */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Etüt Saati Düzenle" : "Yeni Etüt Saati Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Etüt saati bilgilerini güncelleyin" 
                : "Yeni bir etüt saati için gerekli bilgileri doldurun"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Etüt Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Örn: Ödev Etüdü, 1. Ders Etüdü, vs."
                  required
                />
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
                  <Label htmlFor="startTime">Başlangıç Saati *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Bitiş Saati *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    required
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
                disabled={sessionMutation.isPending}
              >
                {sessionMutation.isPending && (
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

export default HomeworkSessionManagementPage;