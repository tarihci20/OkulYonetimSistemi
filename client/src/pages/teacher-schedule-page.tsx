import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Search, 
  List, 
  Grid3X3,
  Clock,
  Info,
  School,
  User,
  BookOpen
} from 'lucide-react';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { getTurkishDayName } from '@/lib/utils';

const TeacherSchedulePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [viewType, setViewType] = useState<string>('teacher');
  
  const { getDayOfWeek } = useTurkishDate();
  const currentDayOfWeek = getDayOfWeek() === 0 ? 7 : getDayOfWeek();
  
  // Fetch all schedules
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/enhanced/schedules']
  });
  
  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers']
  });
  
  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes']
  });
  
  // Fetch all periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['/api/periods']
  });
  
  // Filter schedules based on selected criteria
  const filteredSchedules = React.useMemo(() => {
    if (!schedules) return [];
    
    let filtered = [...schedules];
    
    // Filter by day of week
    if (selectedDay) {
      filtered = filtered.filter(schedule => schedule.dayOfWeek.toString() === selectedDay);
    }
    
    // Filter by teacher
    if (selectedTeacher) {
      filtered = filtered.filter(schedule => schedule.teacher.id.toString() === selectedTeacher);
    }
    
    // Filter by class
    if (selectedClass) {
      filtered = filtered.filter(schedule => schedule.class.id.toString() === selectedClass);
    }
    
    return filtered;
  }, [schedules, selectedDay, selectedTeacher, selectedClass]);
  
  // Group schedules by teacher and day for weekly view
  const teacherWeeklySchedules = React.useMemo(() => {
    if (!teachers || !schedules || !periods) return [];
    
    return teachers.map(teacher => {
      const teacherSchedules = schedules
        .filter(schedule => schedule.teacher.id === teacher.id)
        .sort((a, b) => a.period.order - b.period.order);
      
      // Create a map of day -> periodOrder -> schedule
      const daySchedules = {};
      for (let day = 1; day <= 7; day++) {
        daySchedules[day] = {};
        teacherSchedules
          .filter(schedule => schedule.dayOfWeek === day)
          .forEach(schedule => {
            daySchedules[day][schedule.period.order] = schedule;
          });
      }
      
      return {
        teacher,
        daySchedules
      };
    });
  }, [teachers, schedules, periods]);
  
  // Group schedules by class and day for weekly view
  const classWeeklySchedules = React.useMemo(() => {
    if (!classes || !schedules || !periods) return [];
    
    return classes.map(cls => {
      const classSchedules = schedules
        .filter(schedule => schedule.class.id === cls.id)
        .sort((a, b) => a.period.order - b.period.order);
      
      // Create a map of day -> periodOrder -> schedule
      const daySchedules = {};
      for (let day = 1; day <= 7; day++) {
        daySchedules[day] = {};
        classSchedules
          .filter(schedule => schedule.dayOfWeek === day)
          .forEach(schedule => {
            daySchedules[day][schedule.period.order] = schedule;
          });
      }
      
      return {
        class: cls,
        daySchedules
      };
    });
  }, [classes, schedules, periods]);
  
  // Function to render a schedule cell
  const renderScheduleCell = (schedule, isDraggable = false) => {
    if (!schedule) return <div className="h-12"></div>;
    
    return (
      <div 
        className="bg-primary bg-opacity-10 p-2 rounded text-xs h-full flex flex-col justify-between"
        draggable={isDraggable}
      >
        <div className="font-medium">{schedule.subject.name}</div>
        <div className="flex justify-between items-center mt-1">
          <span>{schedule.class.name}</span>
          {viewType === 'class' && (
            <span className="text-primary text-xs">{schedule.teacher.fullName}</span>
          )}
        </div>
      </div>
    );
  };
  
  if (schedulesLoading || teachersLoading || classesLoading || periodsLoading) {
    return (
      <DashboardLayout title="Ders Programı">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Ders Programı">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              <span>Ders Programı</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={viewType === 'teacher' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewType('teacher')}
              >
                <User className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Öğretmen</span>
              </Button>
              <Button 
                variant={viewType === 'class' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewType('class')}
              >
                <School className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Sınıf</span>
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Öğretmen ve sınıf bazlı ders programları
          </CardDescription>
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
              <Label htmlFor="teacher" className="mb-1 block">Öğretmen</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Tüm öğretmenler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm öğretmenler</SelectItem>
                  {teachers && teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name} {teacher.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="class" className="mb-1 block">Sınıf</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Tüm sınıflar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm sınıflar</SelectItem>
                  {classes && classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={() => {
                setSelectedDay('');
                setSelectedTeacher('');
                setSelectedClass('');
              }}>
                Filtrele
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="flex items-center">
                <List className="mr-1 h-4 w-4" />
                <span>Liste</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center">
                <Grid3X3 className="mr-1 h-4 w-4" />
                <span>Haftalık</span>
              </TabsTrigger>
              <TabsTrigger value="current" className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>Anlık</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gün</TableHead>
                      <TableHead>Ders</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead>Öğretmen</TableHead>
                      <TableHead>Ders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules
                        .sort((a, b) => {
                          // Sort by day, then by period
                          if (a.dayOfWeek !== b.dayOfWeek) {
                            return a.dayOfWeek - b.dayOfWeek;
                          }
                          return a.period.order - b.period.order;
                        })
                        .map(schedule => (
                          <TableRow key={schedule.id}>
                            <TableCell>{getTurkishDayName(schedule.dayOfWeek)}</TableCell>
                            <TableCell>{schedule.period.order}. Ders</TableCell>
                            <TableCell>{schedule.period.startTime} - {schedule.period.endTime}</TableCell>
                            <TableCell>{schedule.class.name}</TableCell>
                            <TableCell>{schedule.teacher.fullName}</TableCell>
                            <TableCell>{schedule.subject.name}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          <div className="flex flex-col items-center justify-center text-neutral-400">
                            <Info className="h-8 w-8 mb-2" />
                            <p>Seçili kriterlere uygun ders bulunamadı.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly">
              {viewType === 'teacher' ? (
                <div>
                  {teacherWeeklySchedules
                    .filter(item => !selectedTeacher || item.teacher.id.toString() === selectedTeacher)
                    .map(item => (
                      <div key={item.teacher.id} className="mb-8">
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <User className="h-5 w-5 mr-2 text-primary" />
                          {item.teacher.name} {item.teacher.surname} ({item.teacher.branch})
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 gap-2 mb-2">
                              <div className="font-medium text-center">Saat</div>
                              <div className="font-medium text-center">Pazartesi</div>
                              <div className="font-medium text-center">Salı</div>
                              <div className="font-medium text-center">Çarşamba</div>
                              <div className="font-medium text-center">Perşembe</div>
                              <div className="font-medium text-center">Cuma</div>
                              <div className="font-medium text-center">Cumartesi</div>
                              <div className="font-medium text-center">Pazar</div>
                            </div>
                            
                            {periods && periods
                              .sort((a, b) => a.order - b.order)
                              .map(period => (
                                <div 
                                  key={period.id} 
                                  className={`grid grid-cols-8 gap-2 mb-2 ${period.order % 2 === 0 ? 'bg-gray-50' : ''}`}
                                >
                                  <div className="p-2 text-xs text-center flex flex-col justify-center">
                                    <div>{period.order}. Ders</div>
                                    <div className="text-neutral-500">{period.startTime} - {period.endTime}</div>
                                  </div>
                                  
                                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                    <div key={day} className="p-1 min-h-[4rem]">
                                      {item.daySchedules[day] && item.daySchedules[day][period.order] ? 
                                        renderScheduleCell(item.daySchedules[day][period.order], true) : 
                                        null
                                      }
                                    </div>
                                  ))}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div>
                  {classWeeklySchedules
                    .filter(item => !selectedClass || item.class.id.toString() === selectedClass)
                    .map(item => (
                      <div key={item.class.id} className="mb-8">
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <School className="h-5 w-5 mr-2 text-primary" />
                          {item.class.name} Sınıfı
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 gap-2 mb-2">
                              <div className="font-medium text-center">Saat</div>
                              <div className="font-medium text-center">Pazartesi</div>
                              <div className="font-medium text-center">Salı</div>
                              <div className="font-medium text-center">Çarşamba</div>
                              <div className="font-medium text-center">Perşembe</div>
                              <div className="font-medium text-center">Cuma</div>
                              <div className="font-medium text-center">Cumartesi</div>
                              <div className="font-medium text-center">Pazar</div>
                            </div>
                            
                            {periods && periods
                              .sort((a, b) => a.order - b.order)
                              .map(period => (
                                <div 
                                  key={period.id} 
                                  className={`grid grid-cols-8 gap-2 mb-2 ${period.order % 2 === 0 ? 'bg-gray-50' : ''}`}
                                >
                                  <div className="p-2 text-xs text-center flex flex-col justify-center">
                                    <div>{period.order}. Ders</div>
                                    <div className="text-neutral-500">{period.startTime} - {period.endTime}</div>
                                  </div>
                                  
                                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                    <div key={day} className="p-1 min-h-[4rem]">
                                      {item.daySchedules[day] && item.daySchedules[day][period.order] ? 
                                        renderScheduleCell(item.daySchedules[day][period.order], true) : 
                                        null
                                      }
                                    </div>
                                  ))}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="current">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  Şu anda devam eden dersler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSchedules
                    .filter(schedule => 
                      schedule.dayOfWeek === currentDayOfWeek
                    )
                    .sort((a, b) => a.period.order - b.period.order)
                    .map(schedule => (
                      <Card key={schedule.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-primary" />
                              <span>{schedule.subject.name}</span>
                            </div>
                            <div className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                              {schedule.period.order}. Ders
                            </div>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {schedule.period.startTime} - {schedule.period.endTime}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <School className="h-4 w-4 mr-1 text-neutral-500" />
                              <span className="text-sm">{schedule.class.name}</span>
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-neutral-500" />
                              <span className="text-sm">{schedule.teacher.fullName}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
                
                {filteredSchedules.filter(schedule => schedule.dayOfWeek === currentDayOfWeek).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                    <Info className="h-8 w-8 mb-2" />
                    <p>Şu anda aktif ders bulunmamaktadır.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg md:hidden flex items-center justify-center">
            <Search className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Hızlı Arama</SheetTitle>
            <SheetDescription>
              Öğretmen veya sınıf seçerek hızlıca ders programı bulun.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-teacher">Öğretmen</Label>
              <Select 
                value={selectedTeacher} 
                onValueChange={(value) => {
                  setSelectedTeacher(value);
                  setSelectedClass('');
                }}
              >
                <SelectTrigger id="quick-teacher">
                  <SelectValue placeholder="Öğretmen seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm öğretmenler</SelectItem>
                  {teachers && teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name} {teacher.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quick-class">Sınıf</Label>
              <Select 
                value={selectedClass} 
                onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedTeacher('');
                }}
              >
                <SelectTrigger id="quick-class">
                  <SelectValue placeholder="Sınıf seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm sınıflar</SelectItem>
                  {classes && classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full" onClick={() => {
              document.querySelector('[data-radix-collection-item][value="weekly"]')?.click();
            }}>
              Programı Görüntüle
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default TeacherSchedulePage;
