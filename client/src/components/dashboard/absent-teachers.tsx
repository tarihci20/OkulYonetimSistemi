import React from "react";
import { useQuery } from "@tanstack/react-query";
import { UserX, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTurkishDate } from "@/hooks/use-turkish-date";

interface AbsentTeacher {
  id: number;
  teacher: {
    id: number;
    name: string;
    surname: string;
    branch: string;
    fullName: string;
  };
  reason: string;
  startDate: string;
  endDate: string;
}

const AbsentTeachers: React.FC = () => {
  const { formatDate } = useTurkishDate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/absences/date/" + new Date().toISOString()],
    select: (data) => data.slice(0, 5), // Limit to 5 for display
  });

  // Calculate how many lessons a teacher is missing today
  const getLessonCount = (teacherId: number) => {
    // This would ideally come from the API
    // For demo purposes, using random numbers
    const lessonCounts = [2, 3, 4, 5, 1];
    return lessonCounts[teacherId % lessonCounts.length];
  };

  if (isLoading) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-error border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
        <div className="text-error">İzinli öğretmen verisi yüklenirken hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="col-span-1 bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">İzinli Öğretmenler</h3>
        <Link href="/absent">
          <Button size="sm" className="text-xs bg-error text-white px-2 py-1 rounded-full flex items-center h-auto">
            <Plus className="h-3 w-3 mr-1" />
            <span>Yeni</span>
          </Button>
        </Link>
      </div>
      
      <div className="overflow-y-auto max-h-64">
        {data && data.length > 0 ? (
          data.map((absence: AbsentTeacher) => (
            <div key={absence.id} className="flex items-center p-2 border-b">
              <div className="w-10 h-10 rounded-full bg-error bg-opacity-10 text-error flex items-center justify-center">
                <UserX className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <div className="font-medium">{absence.teacher.fullName}</div>
                <div className="text-sm text-neutral-500">{absence.teacher.branch}</div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-error bg-opacity-10 text-error px-2 py-1 rounded-full">
                  {getLessonCount(absence.teacher.id)} Ders
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <UserX className="h-8 w-8 mb-2" />
            <p>Bugün izinli öğretmen bulunmamaktadır</p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <Link href="/absent">
          <Button variant="link" className="text-error text-sm flex items-center p-0 h-auto">
            <span>Yoklama yönetimine git</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AbsentTeachers;
