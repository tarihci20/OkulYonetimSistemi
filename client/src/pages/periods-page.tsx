import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash, Check, X, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Period {
  id: number;
  order: number;
  startTime: string;
  endTime: string;
}

const PeriodsPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [formData, setFormData] = useState({
    order: '',
    startTime: '',
    endTime: '',
  });

  // Dönemleri getir
  const { data: periods, isLoading } = useQuery<Period[]>({
    queryKey: ['/api/periods'],
  });

  // Dönem ekle/güncelle mutation
  const periodMutation = useMutation({
    mutationFn: async (data: Partial<Period>) => {
      const url = isEditing && currentPeriod 
        ? `/api/periods/${currentPeriod.id}` 
        : '/api/periods';
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
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      // Diyaloğu kapat
      setIsDialogOpen(false);
      // Formu sıfırla
      resetForm();
      
      toast({
        title: isEditing ? "Ders saati güncellendi" : "Yeni ders saati eklendi",
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

  // Dönem silme mutation
  const deletePeriodMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/periods/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      
      toast({
        title: "Ders saati silindi",
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

  // Düzenleme modalını aç
  const handleEdit = (period: Period) => {
    setIsEditing(true);
    setCurrentPeriod(period);
    setFormData({
      order: period.order.toString(),
      startTime: period.startTime,
      endTime: period.endTime,
    });
    setIsDialogOpen(true);
  };

  // Yeni dönem modalını aç
  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentPeriod(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Silme işlemi
  const handleDelete = (id: number) => {
    if (window.confirm('Bu ders saatini silmek istediğinize emin misiniz?')) {
      deletePeriodMutation.mutate(id);
    }
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderNum = parseInt(formData.order);
    if (isNaN(orderNum) || orderNum <= 0) {
      toast({
        title: "Geçersiz ders saati sırası",
        description: "Lütfen geçerli bir sıra numarası girin",
        variant: "destructive",
      });
      return;
    }
    
    periodMutation.mutate({
      order: orderNum,
      startTime: formData.startTime,
      endTime: formData.endTime,
      ...(isEditing && currentPeriod ? { id: currentPeriod.id } : {})
    });
  };

  // Form değişikliklerini takip et
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Formu sıfırla
  const resetForm = () => {
    setFormData({
      order: '',
      startTime: '',
      endTime: '',
    });
  };

  // Sıralama fonksiyonu
  const sortedPeriods = React.useMemo(() => {
    if (!periods) return [];
    return [...periods].sort((a, b) => a.order - b.order);
  }, [periods]);

  return (
    <DashboardLayout title="Zil ve Teneffüs Saatleri">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Ders Saatleri Yönetimi</CardTitle>
            <CardDescription>
              Ders ve teneffüs saat aralıklarını düzenleyin
            </CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Ders Saati Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sıra</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPeriods.length > 0 ? (
                  sortedPeriods.map((period, index) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.order}. Ders</TableCell>
                      <TableCell>{period.startTime}</TableCell>
                      <TableCell>{period.endTime}</TableCell>
                      <TableCell>
                        {calculateDuration(period.startTime, period.endTime)} dk
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(period)}
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(period.id)}
                          title="Sil"
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                      <Clock className="mx-auto h-8 w-8 mb-2 opacity-40" />
                      <p>Henüz ders saati tanımlanmamış</p>
                      <p className="text-sm">Yeni ders saati eklemek için "Yeni Ders Saati Ekle" butonunu kullanın</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ekle/Düzenle Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Ders Saati Düzenle" : "Yeni Ders Saati Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Mevcut ders saati bilgilerini güncelleyin" 
                : "Yeni bir ders saati için gerekli bilgileri girin"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="order">Sıra Numarası</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={handleChange}
                  required
                  placeholder="Ör: 1"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="startTime">Başlangıç Saati</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endTime">Bitiş Saati</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" /> İptal
              </Button>
              <Button type="submit" disabled={periodMutation.isPending}>
                {periodMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
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

// Saat formatlarını süreye (dakika olarak) dönüştürür
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
}

export default PeriodsPage;