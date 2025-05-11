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
  FormDescription,
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
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { User, Plus, Pencil, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

// Schema for adding/editing teacher
const teacherFormSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyisim en az 2 karakter olmalıdır"),
  branch: z.string().min(2, "Branş en az 2 karakter olmalıdır"),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface Teacher {
  id: number;
  name: string;
  surname: string;
  branch: string;
}

const TeacherManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const { toast } = useToast();
  
  // Fetch all teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/teachers']
  });
  
  // Fetch all subjects for branch selection
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects']
  });
  
  // Form for adding/editing teacher
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      surname: "",
      branch: "",
    },
  });
  
  // Reset form when opening dialog
  React.useEffect(() => {
    if (isDialogOpen) {
      if (editingTeacher) {
        form.reset({
          name: editingTeacher.name,
          surname: editingTeacher.surname,
          branch: editingTeacher.branch,
        });
      } else {
        form.reset({
          name: "",
          surname: "",
          branch: "",
        });
      }
    }
  }, [isDialogOpen, editingTeacher, form]);
  
  // Add teacher mutation
  const addTeacherMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      return await apiRequest("POST", "/api/teachers", values);
    },
    onSuccess: () => {
      toast({
        title: "Öğretmen eklendi",
        description: "Öğretmen başarıyla kaydedildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Öğretmen eklenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: async (data: { id: number; values: TeacherFormValues }) => {
      return await apiRequest("PUT", `/api/teachers/${data.id}`, data.values);
    },
    onSuccess: () => {
      toast({
        title: "Öğretmen güncellendi",
        description: "Öğretmen bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Öğretmen güncellenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/teachers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Öğretmen silindi",
        description: "Öğretmen başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Öğretmen silinirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: TeacherFormValues) => {
    if (editingTeacher) {
      updateTeacherMutation.mutate({ id: editingTeacher.id, values });
    } else {
      addTeacherMutation.mutate(values);
    }
  };
  
  // Handle edit teacher
  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsDialogOpen(true);
  };
  
  // Handle delete teacher
  const handleDeleteTeacher = (id: number) => {
    if (confirm("Bu öğretmeni silmek istediğinize emin misiniz?")) {
      deleteTeacherMutation.mutate(id);
    }
  };
  
  // Table columns
  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "name",
      header: "İsim",
    },
    {
      accessorKey: "surname",
      header: "Soyisim",
    },
    {
      accessorKey: "branch",
      header: "Branş",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const teacher = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditTeacher(teacher)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteTeacher(teacher.id)}
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
          <User className="mr-2 h-5 w-5" />
          Öğretmen Yönetimi
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Öğretmen Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? "Öğretmen Düzenle" : "Yeni Öğretmen Ekle"}
              </DialogTitle>
              <DialogDescription>
                Öğretmen bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İsim</FormLabel>
                      <FormControl>
                        <Input placeholder="Öğretmen adı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soyisim</FormLabel>
                      <FormControl>
                        <Input placeholder="Öğretmen soyadı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branş</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Branş seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Branş listede yoksa önce Dersler kısmından ekleyin
                      </FormDescription>
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
                      setEditingTeacher(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addTeacherMutation.isPending || updateTeacherMutation.isPending}
                  >
                    {addTeacherMutation.isPending || updateTeacherMutation.isPending ? (
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
        data={teachers || []}
        searchKey="name"
        searchPlaceholder="İsim, soyisim veya branşa göre ara..."
      />
    </div>
  );
};

export default TeacherManagement;
