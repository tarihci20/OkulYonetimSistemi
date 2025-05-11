import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList, User, MapPin, CalendarClock, Filter } from 'lucide-react';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { getTurkishDayName } from '@/lib/utils';
import DutyCalendar from '@/components/duty/duty-calendar';
import DutyTeacherList from '@/components/duty/duty-teacher-list';

const DutyManagementPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const { getDayOfWeek, formattedDate } = useTurkishDate();
  const currentDayOfWeek = getDayOfWeek() === 0 ? 7 : getDayOfWeek();
  
  // Fetch all duty assignments
  const { data: duties, isLoading: dutiesLoading } = useQuery({
    queryKey: ['/api/enhanced/duties']
  });
  
  // Fetch all duty locations
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/duty-locations']
  });
  
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
  
  if (dutiesLoading || locationsLoading) {
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
                  <SelectItem value="">Tüm günler</SelectItem>
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
                  <SelectItem value="">Tüm nöbet yerleri</SelectItem>
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
    </DashboardLayout>
  );
};

export default DutyManagementPage;
