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
import { School, Plus, Pencil, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

// Schema for adding/editing class
const classFormSchema = z.object({
  name: z.string().min(2, "Sınıf adı en az 2 karakter olmalıdır").regex(/^[0-9]+\/[A-Z]+$/, "Sınıf adı '10/A' formatında olmalıdır"),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface Class {
  id: number;
  name: string;
}

const ClassManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { toast } = useToast();
  
  // Fetch all classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/classes']
  });
  
  // Form for adding/editing class
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
    },
  });
  
  // Reset form when opening dialog
  React.useEffect(() => {
    if (isDialogOpen) {
      if (editingClass) {
        form.reset({
          name: editingClass.name,
        });
      } else {
        form.reset({
          name: "",
        });
      }
    }
  }, [isDialogOpen, editingClass, form]);
  
  // Add class mutation
  const addClassMutation = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      return await apiRequest("POST", "/api/classes", values);
    },
    onSuccess: () => {
      toast({
        title: "Sınıf eklendi",
        description: "Sınıf başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sınıf eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async (data: { id: number; values: ClassFormValues }) => {
      return await apiRequest("PUT", `/api/classes/${data.id}`, data.values);
    },
    onSuccess: () => {
      toast({
        title: "Sınıf güncellendi",
        description: "Sınıf bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsDialogOpen(false);
      setEditingClass(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sınıf güncellenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sınıf silindi",
        description: "Sınıf başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sınıf silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ClassFormValues) => {
    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, values });
    } else {
      addClassMutation.mutate(values);
    }
  };
  
  // Handle edit class
  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setIsDialogOpen(true);
  };
  
  // Handle delete class
  const handleDeleteClass = (id: number) => {
    if (confirm("Bu sınıfı silmek istediğinize emin misiniz?")) {
      deleteClassMutation.mutate(id);
    }
  };
  
  // Table columns
  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: "name",
      header: "Sınıf Adı",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const cls = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditClass(cls)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteClass(cls.id)}
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
          <School className="mr-2 h-5 w-5" />
          Sınıf Yönetimi
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Sınıf Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "Sınıf Düzenle" : "Yeni Sınıf Ekle"}
              </DialogTitle>
              <DialogDescription>
                Sınıf bilgilerini girin (Örnek: 10/A)
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sınıf Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örnek: 10/A" {...field} />
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
                      setEditingClass(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addClassMutation.isPending || updateClassMutation.isPending}
                  >
                    {addClassMutation.isPending || updateClassMutation.isPending ? (
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
        data={classes || []}
        searchKey="name"
        searchPlaceholder="Sınıf adına göre ara..."
      />
    </div>
  );
};

export default ClassManagement;
