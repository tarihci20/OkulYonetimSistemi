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
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

// Schema for adding/editing subject
const subjectFormSchema = z.object({
  name: z.string().min(2, "Ders adı en az 2 karakter olmalıdır"),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

interface Subject {
  id: number;
  name: string;
}

const SubjectManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();
  
  // Fetch all subjects
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['/api/subjects']
  });
  
  // Form for adding/editing subject
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
    },
  });
  
  // Reset form when opening dialog
  React.useEffect(() => {
    if (isDialogOpen) {
      if (editingSubject) {
        form.reset({
          name: editingSubject.name,
        });
      } else {
        form.reset({
          name: "",
        });
      }
    }
  }, [isDialogOpen, editingSubject, form]);
  
  // Add subject mutation
  const addSubjectMutation = useMutation({
    mutationFn: async (values: SubjectFormValues) => {
      return await apiRequest("POST", "/api/subjects", values);
    },
    onSuccess: () => {
      toast({
        title: "Ders eklendi",
        description: "Ders başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: async (data: { id: number; values: SubjectFormValues }) => {
      return await apiRequest("PUT", `/api/subjects/${data.id}`, data.values);
    },
    onSuccess: () => {
      toast({
        title: "Ders güncellendi",
        description: "Ders bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsDialogOpen(false);
      setEditingSubject(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders güncellenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Ders silindi",
        description: "Ders başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: SubjectFormValues) => {
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, values });
    } else {
      addSubjectMutation.mutate(values);
    }
  };
  
  // Handle edit subject
  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsDialogOpen(true);
  };
  
  // Handle delete subject
  const handleDeleteSubject = (id: number) => {
    if (confirm("Bu dersi silmek istediğinize emin misiniz?")) {
      deleteSubjectMutation.mutate(id);
    }
  };
  
  // Table columns
  const columns: ColumnDef<Subject>[] = [
    {
      accessorKey: "name",
      header: "Ders Adı",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subject = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditSubject(subject)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteSubject(subject.id)}
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
          <BookOpen className="mr-2 h-5 w-5" />
          Ders Yönetimi
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Ders Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Ders Düzenle" : "Yeni Ders Ekle"}
              </DialogTitle>
              <DialogDescription>
                Ders bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ders Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Ders adı giriniz" {...field} />
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
                      setEditingSubject(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addSubjectMutation.isPending || updateSubjectMutation.isPending}
                  >
                    {addSubjectMutation.isPending || updateSubjectMutation.isPending ? (
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
        data={subjects || []}
        searchKey="name"
        searchPlaceholder="Ders adına göre ara..."
      />
    </div>
  );
};

export default SubjectManagement;
