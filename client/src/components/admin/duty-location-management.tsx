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
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

// Schema for adding/editing duty location
const locationFormSchema = z.object({
  name: z.string().min(2, "Nöbet yeri adı en az 2 karakter olmalıdır"),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface DutyLocation {
  id: number;
  name: string;
}

const DutyLocationManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DutyLocation | null>(null);
  const { toast } = useToast();
  
  // Fetch all duty locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['/api/duty-locations']
  });
  
  // Form for adding/editing duty location
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
    },
  });
  
  // Reset form when opening dialog
  React.useEffect(() => {
    if (isDialogOpen) {
      if (editingLocation) {
        form.reset({
          name: editingLocation.name,
        });
      } else {
        form.reset({
          name: "",
        });
      }
    }
  }, [isDialogOpen, editingLocation, form]);
  
  // Add duty location mutation
  const addLocationMutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      return await apiRequest("POST", "/api/duty-locations", values);
    },
    onSuccess: () => {
      toast({
        title: "Nöbet yeri eklendi",
        description: "Nöbet yeri başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/duty-locations'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Nöbet yeri eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update duty location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (data: { id: number; values: LocationFormValues }) => {
      return await apiRequest("PUT", `/api/duty-locations/${data.id}`, data.values);
    },
    onSuccess: () => {
      toast({
        title: "Nöbet yeri güncellendi",
        description: "Nöbet yeri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/duty-locations'] });
      setIsDialogOpen(false);
      setEditingLocation(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Nöbet yeri güncellenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete duty location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/duty-locations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Nöbet yeri silindi",
        description: "Nöbet yeri başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/duty-locations'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Nöbet yeri silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: LocationFormValues) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, values });
    } else {
      addLocationMutation.mutate(values);
    }
  };
  
  // Handle edit duty location
  const handleEditLocation = (location: DutyLocation) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };
  
  // Handle delete duty location
  const handleDeleteLocation = (id: number) => {
    if (confirm("Bu nöbet yerini silmek istediğinize emin misiniz?")) {
      deleteLocationMutation.mutate(id);
    }
  };
  
  // Table columns
  const columns: ColumnDef<DutyLocation>[] = [
    {
      accessorKey: "name",
      header: "Nöbet Yeri",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const location = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditLocation(location)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteLocation(location.id)}
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
          <MapPin className="mr-2 h-5 w-5" />
          Nöbet Yerleri Yönetimi
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Nöbet Yeri Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Nöbet Yeri Düzenle" : "Yeni Nöbet Yeri Ekle"}
              </DialogTitle>
              <DialogDescription>
                Nöbet yeri bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nöbet Yeri Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örnek: A Blok - 1. Kat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingLocation(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addLocationMutation.isPending || updateLocationMutation.isPending}
                  >
                    {addLocationMutation.isPending || updateLocationMutation.isPending ? (
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
        data={locations || []}
        searchKey="name"
        searchPlaceholder="Nöbet yeri adına göre ara..."
      />
    </div>
  );
};

export default DutyLocationManagement;
