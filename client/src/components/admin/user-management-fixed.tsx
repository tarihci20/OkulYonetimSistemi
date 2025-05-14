import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCog, Plus, Loader2, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Form validation schema
const userFormSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır').optional(),
  fullName: z.string().min(1, 'Ad soyad gereklidir'),
  isAdmin: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface User {
  id: number;
  username: string;
  fullName: string;
  isAdmin: boolean;
  lastLogin?: string;
}

const UserManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Fetch users
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users');
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      isAdmin: true,
    },
  });
  
  // Update form values when editing a user
  useEffect(() => {
    if (selectedUser) {
      form.setValue('username', selectedUser.username);
      form.setValue('fullName', selectedUser.fullName || '');
      form.setValue('isAdmin', selectedUser.isAdmin);
      // Don't set password as we don't want to expose or change it unless explicitly requested
      form.unregister('password');
    } else {
      form.reset({
        username: '',
        password: '',
        fullName: '',
        isAdmin: true,
      });
    }
  }, [selectedUser, form]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest('POST', '/api/register', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Yönetici başarıyla eklendi.',
      });
      refetch(); // Explicitly refetch users
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Yönetici eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormValues & { id?: number }) => {
      if (!selectedUser?.id) throw new Error('Kullanıcı ID bulunamadı');
      const { id, ...updateData } = data;
      
      // If password is empty, omit it (don't update password)
      if (!updateData.password) {
        const { password, ...withoutPassword } = updateData;
        const res = await apiRequest('PATCH', `/api/users/${selectedUser.id}`, withoutPassword);
        return await res.json();
      } else {
        const res = await apiRequest('PATCH', `/api/users/${selectedUser.id}`, updateData);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Yönetici başarıyla güncellendi.',
      });
      refetch(); // Explicitly refetch users
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      form.reset();
      setSelectedUser(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Yönetici güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: UserFormValues) => {
    if (isEditMode && selectedUser) {
      updateUserMutation.mutate({ ...data, id: selectedUser.id });
    } else {
      createUserMutation.mutate(data);
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    if (!createUserMutation.isPending && !updateUserMutation.isPending) {
      form.reset();
      setSelectedUser(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
    }
  };
  
  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Yönetici Kullanıcılar</h2>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Yenile
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Yönetici Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Yönetici Düzenle' : 'Yeni Yönetici Ekle'}</DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? 'Yönetici bilgilerini güncellemek için formu düzenleyin.' 
                    : 'Yeni bir yönetici kullanıcı oluşturmak için bilgileri giriniz.'}
                </DialogDescription>
              </DialogHeader>
            
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Soyad</FormLabel>
                        <FormControl>
                          <Input placeholder="Ad ve soyadı giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Kullanıcı adı giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isEditMode ? 'Şifre (değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={isEditMode ? "Değiştirmek için yeni şifre giriniz" : "Şifre giriniz"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Yönetici yetkisi</FormLabel>
                        <FormDescription>
                          (İşaretli olmalıdır)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDialogClose}
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      İptal
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      {createUserMutation.isPending || updateUserMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>{isEditMode ? "Güncelleniyor..." : "Ekleniyor..."}</span>
                        </div>
                      ) : (
                        <span>{isEditMode ? "Güncelle" : "Kaydet"}</span>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>Kullanıcılar yüklenirken bir hata oluştu.</p>
        </div>
      ) : users && users.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Yönetici</TableHead>
                <TableHead>Son Giriş</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.isAdmin ? 'Evet' : 'Hayır'}</TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString('tr-TR') : 'Hiç giriş yapmadı'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-6 text-center">
          <UserCog className="h-10 w-10 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Sistem varsayılan yönetici kullanıcısı: <strong>admin</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;