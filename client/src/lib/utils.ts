import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import html2canvas from "html2canvas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert a reference to an element or a selector to a PNG and download it
export async function exportToPng(elementRef: HTMLElement | string, filename: string = "export.png") {
  try {
    const element = typeof elementRef === "string" 
      ? document.querySelector(elementRef) as HTMLElement
      : elementRef;
      
    if (!element) {
      throw new Error("Element not found");
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    
    return true;
  } catch (error) {
    console.error("Error exporting to PNG:", error);
    return false;
  }
}

// Helper function to get day name in Turkish
export function getTurkishDayName(dayNumber: number): string {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  
  // Adjust for API using 1-7 format with Monday as 1
  const adjustedDay = dayNumber === 7 ? 0 : dayNumber;
  
  return days[adjustedDay];
}

// Helper function to get month name in Turkish
export function getTurkishMonthName(monthNumber: number): string {
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  return months[monthNumber - 1];
}

// Helper function to check if a time is within a period
export function isWithinPeriod(currentTime: string, startTime: string, endTime: string): boolean {
  return currentTime >= startTime && currentTime <= endTime;
}

// Helper function to format teacher full name
export function formatTeacherName(name: string, surname: string): string {
  return `${name} ${surname}`;
}

// Helper function to check if a teacher is available during a specific period
export function isTeacherAvailable(
  teacherId: number,
  dayOfWeek: number,
  periodId: number,
  schedules: any[],
  duties: any[],
  absences: any[]
): {
  available: boolean;
  reason?: string;
} {
  // Check if teacher has a class during this period
  const hasClass = schedules.some(
    schedule => 
      schedule.teacherId === teacherId && 
      schedule.dayOfWeek === dayOfWeek && 
      schedule.periodId === periodId
  );
  
  if (hasClass) {
    return { available: false, reason: "class" };
  }
  
  // Check if teacher has duty during this period
  const hasDuty = duties.some(
    duty => 
      duty.teacherId === teacherId && 
      duty.dayOfWeek === dayOfWeek && 
      (duty.periodId === null || duty.periodId === periodId)
  );
  
  if (hasDuty) {
    return { available: false, reason: "duty" };
  }
  
  // Check if teacher is absent today
  const today = new Date();
  const isAbsent = absences.some(absence => {
    const startDate = new Date(absence.startDate);
    const endDate = new Date(absence.endDate);
    return (
      absence.teacherId === teacherId && 
      today >= startDate && 
      today <= endDate
    );
  });
  
  if (isAbsent) {
    return { available: false, reason: "absent" };
  }
  
  return { available: true };
}

// Helper function to check if two date objects are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper function to format 24hr time for display (e.g. "14:30" to "14:30")
export function formatTimeForDisplay(timeString: string): string {
  if (!timeString) return "";
  
  // If time is already in the correct format (HH:MM), return it
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeString)) {
    // Remove seconds if present
    return timeString.split(':').slice(0, 2).join(':');
  }
  
  try {
    // Try to parse the time string
    const date = new Date(`1970-01-01T${timeString}`);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (e) {
    // If parsing fails, return the original string
    console.error("Error formatting time:", e);
    return timeString;
  }
}
