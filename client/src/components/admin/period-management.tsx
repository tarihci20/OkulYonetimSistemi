import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

// Time validation regex for HH:MM format
const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

// Schema for adding/editing period
const periodFormSchema = z.object({
  order: z.coerce.number().int().positive("Ders sırası pozitif bir sayı olmalıdır"),
  startTime: z.string().regex(timeRegex, "Saat biçimi geçersiz, HH:MM formatında olmalıdır"),
  endTime: z.string().regex(timeRegex, "Saat biçimi geçersiz, HH:MM formatında olmalıdır"),
}).refine(data => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes > startMinutes;
}, {
  message: "Bitiş saati başlangıç saatinden sonra olmalıdır",
  path: ["endTime"],
});

type PeriodFormValues = z.infer<typeof periodFormSchema>;

interface Period {
  id: number;
  order: number;
  startTime: string;
  endTime: string;
}

const PeriodManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const { toast } = useToast();
  
  // Fetch all periods
  const { data: periods, isLoading } = useQuery({
    queryKey: ['/api/periods']
  });
  
  // Form for adding/editing period
  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodFormSchema),
    defaultValues: {
      order: 1,
      startTime: "08:30",
      endTime: "09:10",
    },
  });
  
  // Reset form when opening dialog
  React.useEffect(() => {
    if (isDialogOpen) {
      if (editingPeriod) {
        form.reset({
          order: editingPeriod.order,
          startTime: editingPeriod.startTime,
          endTime: editingPeriod.endTime,
        });
      } else {
        form.reset({
          order: periods ? periods.length + 1 : 1,
          startTime: "08:30",
          endTime: "09:10",
        });
      }
    }
  }, [isDialogOpen, editingPeriod, form, periods]);
  
  // Add period mutation
  const addPeriodMutation = useMutation({
    mutationFn: async (values: PeriodFormValues) => {
      return await apiRequest("POST", "/api/periods", values);
    },
    onSuccess: () => {
      toast({
        title: "Ders saati eklendi",
        description: "Ders saati başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders saati eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update period mutation
  const updatePeriodMutation = useMutation({
    mutationFn: async (data: { id: number; values: PeriodFormValues }) => {
      return await apiRequest("PUT", `/api/periods/${data.id}`, data.values);
    },
    onSuccess: () => {
      toast({
        title: "Ders saati güncellendi",
        description: "Ders saati bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      setIsDialogOpen(false);
      setEditingPeriod(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders saati güncellenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete period mutation
  const deletePeriodMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/periods/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Ders saati silindi",
        description: "Ders saati başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders saati silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: PeriodFormValues) => {
    if (editingPeriod) {
      updatePeriodMutation.mutate({ id: editingPeriod.id, values });
    } else {
      addPeriodMutation.mutate(values);
    }
  };
  
  // Handle edit period
  const handleEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setIsDialogOpen(true);
  };
  
  // Handle delete period
  const handleDeletePeriod = (id: number) => {
    if (confirm("Bu ders saatini silmek istediğinize emin misiniz?")) {
      deletePeriodMutation.mutate(id);
    }
  };
  
  // Table columns
  const columns: ColumnDef<Period>[] = [
    {
      accessorKey: "order",
      header: "Ders No",
      cell: ({ row }) => `${row.original.order}. Ders`,
    },
    {
      accessorKey: "startTime",
      header: "Başlangıç",
    },
    {
      accessorKey: "endTime",
      header: "Bitiş",
    },
    {
      id: "duration",
      header: "Süre",
      cell: ({ row }) => {
        const start = row.original.startTime.split(':').map(Number);
        const end = row.original.endTime.split(':').map(Number);
        
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        
        const durationMinutes = endMinutes - startMinutes;
        
        return `${durationMinutes} dakika`;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const period = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditPeriod(period)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeletePeriod(period.id)}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Ders Saatleri Yönetimi
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Ders Saati Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPeriod ? "Ders Saati Düzenle" : "Yeni Ders Saati Ekle"}
              </DialogTitle>
              <DialogDescription>
                Ders saati bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ders Sırası</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Kaçıncı ders olduğunu belirtin (1, 2, 3...)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Saati</FormLabel>
                        <FormControl>
                          <Input placeholder="08:30" {...field} />
                        </FormControl>
                        <FormDescription>
                          24 saat formatında (HH:MM)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Saati</FormLabel>
                        <FormControl>
                          <Input placeholder="09:10" {...field} />
                        </FormControl>
                        <FormDescription>
                          24 saat formatında (HH:MM)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingPeriod(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addPeriodMutation.isPending || updatePeriodMutation.isPending}
                  >
                    {addPeriodMutation.isPending || updatePeriodMutation.isPending ? (
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
      
      <DataTable 
        columns={columns}
        data={periods ? [...periods].sort((a, b) => a.order - b.order) : []}
        searchKey="order"
        searchPlaceholder="Ders sırasına göre ara..."
      />
    </div>
  );
};

export default PeriodManagement;
