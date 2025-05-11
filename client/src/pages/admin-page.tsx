import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Users,
  School,
  BookOpen,
  Clock,
  MapPin,
  Settings,
  UserCog
} from 'lucide-react';
import TeacherManagement from '@/components/admin/teacher-management';
import ClassManagement from '@/components/admin/class-management';
import SubjectManagement from '@/components/admin/subject-management';
import PeriodManagement from '@/components/admin/period-management';
import DutyLocationManagement from '@/components/admin/duty-location-management';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const AdminPage: React.FC = () => {
  const [match, params] = useRoute("/admin/:section");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get the active tab from URL or default to "teachers"
  const activeTab = match ? params.section : "teachers";
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    navigate(`/admin/${value}`);
  };
  
  // Check if user is an admin
  if (user && !user.isAdmin) {
    toast({
      title: "Yetkisiz Erişim",
      description: "Bu sayfaya erişmek için yönetici yetkisine sahip olmanız gerekiyor.",
      variant: "destructive",
    });
    navigate('/');
    return null;
  }
  
  return (
    <DashboardLayout title="Yönetim Paneli">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            <span>Yönetim Paneli</span>
          </CardTitle>
          <CardDescription>
            Sistem ayarları ve veri yönetimi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-2">
              <TabsTrigger value="teachers" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>Öğretmenler</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center">
                <School className="mr-2 h-4 w-4" />
                <span>Sınıflar</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Dersler</span>
              </TabsTrigger>
              <TabsTrigger value="periods" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <span>Ders Saatleri</span>
              </TabsTrigger>
              <TabsTrigger value="duty-locations" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>Nöbet Yerleri</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Yöneticiler</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="teachers">
              <TeacherManagement />
            </TabsContent>
            
            <TabsContent value="classes">
              <ClassManagement />
            </TabsContent>
            
            <TabsContent value="subjects">
              <SubjectManagement />
            </TabsContent>
            
            <TabsContent value="periods">
              <PeriodManagement />
            </TabsContent>
            
            <TabsContent value="duty-locations">
              <DutyLocationManagement />
            </TabsContent>
            
            <TabsContent value="admins">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Yönetici Kullanıcılar</h2>
                  <Button>Yeni Yönetici Ekle</Button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                  <p className="text-yellow-800">
                    Yönetici eklemek için Oturum Açma sayfasındaki "Kayıt Ol" seçeneğini kullanabilir ve "Yönetici yetkisi" kutucuğunu işaretleyebilirsiniz.
                  </p>
                </div>
                
                <div className="bg-muted rounded-lg p-6 text-center">
                  <UserCog className="h-10 w-10 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Sistem varsayılan yönetici kullanıcısı: <strong>tarihci20</strong>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminPage;
