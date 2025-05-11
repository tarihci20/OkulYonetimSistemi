import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { useTurkishDate } from '@/hooks/use-turkish-date';
import { getTurkishMonthName } from '@/lib/utils';
import ExtraLessonTable from '@/components/extra-lesson/extra-lesson-table';

const ExtraLessonPage: React.FC = () => {
  // Get current date for default month and year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  
  // Generate years for select (current year and 2 previous years)
  const yearOptions = [
    { value: now.getFullYear(), label: now.getFullYear().toString() },
    { value: now.getFullYear() - 1, label: (now.getFullYear() - 1).toString() },
    { value: now.getFullYear() - 2, label: (now.getFullYear() - 2).toString() }
  ];
  
  // Generate months for select
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getTurkishMonthName(i + 1)
  }));
  
  return (
    <DashboardLayout title="Ek Ders Hesaplaması">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-primary" />
            <span>Ek Ders Hesaplaması</span>
          </CardTitle>
          <CardDescription>
            Öğretmenlerin aylık ek ders hesaplamaları ve raporlaması
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="term" className="mb-1 block">Dönem</Label>
                <Select defaultValue="current">
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Dönem seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">2023-2024 Bahar</SelectItem>
                    <SelectItem value="prev">2023-2024 Güz</SelectItem>
                    <SelectItem value="prev2">2022-2023 Bahar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="month" className="mb-1 block">Ay</Label>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Ay seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label} {selectedYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="year" className="mb-1 block">Yıl</Label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Yıl seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value.toString()}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-4">
              {getTurkishMonthName(selectedMonth)} {selectedYear} Ek Ders Bilgileri
            </h3>
            
            <ExtraLessonTable 
              month={selectedMonth} 
              year={selectedYear} 
            />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ExtraLessonPage;
