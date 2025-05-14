import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTurkishDate } from "@/hooks/use-turkish-date";

interface DutyTeacher {
  id: number;
  teacher: {
    id: number;
    name: string;
    surname: string;
    fullName: string;
  };
  location: {
    id: number;
    name: string;
  };
  dayOfWeek: number;
  dutyType?: 'full_day' | 'break_time';
  period?: {
    id: number;
    order: number;
    startTime: string;
    endTime: string;
  } | null;
}

interface DutyLocation {
  id: number;
  name: string;
}

const DutyTeachers: React.FC = () => {
  const { formattedDate, turkishDayOfWeek, dayOfWeek, date } = useTurkishDate({ 
    updateInterval: 60000 // Her 1 dakikada bir güncelle
  });
  
  // Her gün gece yarısında güncellenmesi için refetch yapılacak bir key oluşturalım
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  
  // Nöbet yerlerini çek
  const { data: dutyLocationsData, isLoading: isLoadingLocations } = useQuery<DutyLocation[]>({
    queryKey: ["/api/duty-locations"],
    refetchInterval: 60 * 60 * 1000 // 1 saatte bir güncelle
  });

  // Nöbet görevlerini çek
  const { data, isLoading, error } = useQuery<DutyTeacher[]>({
    queryKey: ["/api/enhanced/duties", dateKey], // Gün değiştiğinde otomatik refetch yapar
    select: (data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((duty: DutyTeacher) => duty.dayOfWeek === dayOfWeek);
    },
    refetchInterval: 5 * 60 * 1000 // 5 dakikada bir yeniden veri çek
  });

  if (isLoading || isLoadingLocations) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-warning border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
        <div className="text-error">Nöbetçi öğretmen verisi yüklenirken hata oluştu.</div>
      </div>
    );
  }

  // Öğretmenin şu anda nöbet görevinde olup olmadığını kontrol et
  const isTeacherOnDuty = (duty: DutyTeacher) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Eğer period yoksa, tüm gün nöbetçi
    if (!duty.period) return true;
    
    // Aksi takdirde, şu anki zamanın period içinde olup olmadığını kontrol et
    return currentTime >= duty.period.startTime && currentTime <= duty.period.endTime;
  };

  // Belirli bir lokasyondaki öğretmenleri göstermek için fonksiyon
  const renderLocation = (location: DutyLocation) => {
    // Bu lokasyondaki öğretmenleri filtrele
    const teachersInLocation = data?.filter(duty => 
      duty.location.id === location.id
    ) || [];
    
    // Eğer lokasyonda öğretmen yoksa
    if (teachersInLocation.length === 0) {
      return (
        <tr key={location.id}>
          <td className="border border-gray-300 p-2 bg-red-600 text-white font-bold">{location.name}</td>
          <td className="border border-gray-300 p-2">-</td>
        </tr>
      );
    }
    
    // Lokasyonda öğretmen varsa
    return teachersInLocation.map((duty, index) => (
      <tr key={`${location.name}-${duty.id}`}>
        {index === 0 ? (
          <td 
            rowSpan={teachersInLocation.length} 
            className="border border-gray-300 p-2 bg-red-600 text-white font-bold"
          >
            {location.name}
          </td>
        ) : null}
        <td className="border border-gray-300 p-2">
          <div className="flex items-center justify-between">
            <span>
              {duty.teacher.fullName} {duty.dutyType === 'break_time' ? '(Ara Nöbet)' : '(Tüm Gün)'}
            </span>
            {isTeacherOnDuty(duty) && (
              <span className="ml-2 text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                Aktif
              </span>
            )}
          </div>
        </td>
      </tr>
    ));
  };
  
  // Özel sıralamaya göre nöbet yerlerini sıralayacak fonksiyon
  const getSortedLocations = () => {
    if (!dutyLocationsData) return [];
    
    // Özel sıralama: Bahçe, 1. Kat, 2. Kat, Kantin sırasına göre
    const desiredOrder = ["BAHÇE", "1. KAT", "2. KAT", "KANTİN"];
    
    // Önce özel sıralamaya göre sırala
    const sortedLocations = [...dutyLocationsData].sort((a, b) => {
      const aIndex = desiredOrder.findIndex(name => a.name.toUpperCase() === name);
      const bIndex = desiredOrder.findIndex(name => b.name.toUpperCase() === name);
      
      // Eğer iki konum da özel sıralamada ise, indekslerine göre sırala
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      
      // Eğer sadece a özel sıralamada ise a önce gelsin
      if (aIndex !== -1) return -1;
      
      // Eğer sadece b özel sıralamada ise b önce gelsin
      if (bIndex !== -1) return 1;
      
      // İkisi de özel sıralamada değilse alfabetik sırala
      return a.name.localeCompare(b.name);
    });
    
    return sortedLocations;
  };

  return (
    <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Bugünkü Nöbetçiler</h3>
        <div className="text-xs bg-warning text-white px-2 py-1 rounded-full">
          {turkishDayOfWeek}
        </div>
      </div>
      
      <div>
        {data && data.length > 0 ? (
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-2 text-left">Nöbet Yeri</th>
                <th className="border border-gray-300 bg-gray-100 p-2 text-left">ÖĞRETMEN</th>
              </tr>
            </thead>
            <tbody>
              {getSortedLocations().map(renderLocation)}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <ClipboardList className="h-8 w-8 mb-2" />
            <p>Bugün nöbetçi öğretmen bulunmamaktadır</p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <Link href="/duty">
          <Button variant="link" className="text-warning text-sm flex items-center p-0 h-auto">
            <span>Nöbet çizelgesini görüntüle</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DutyTeachers;
