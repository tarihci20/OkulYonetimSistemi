import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export type TurkishDateOptions = {
  updateInterval?: number; // Update interval in milliseconds
  includeTime?: boolean; // Whether to include time in the formatted string
  includeYear?: boolean; // Whether to include year in the formatted string
  includeDay?: boolean; // Whether to include day of week in the formatted string
  dateOnly?: boolean; // If true, return only the date part
  timeOnly?: boolean; // If true, return only the time part
  formatString?: string; // Custom format string to override defaults
};

// Day names in Turkish
const turkishDays = [
  "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
];

// Default options
const defaultOptions: TurkishDateOptions = {
  updateInterval: 60000, // Update every minute by default
  includeTime: true,
  includeYear: true,
  includeDay: true,
  dateOnly: false,
  timeOnly: false,
};

export function useTurkishDate(options: TurkishDateOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [date, setDate] = useState<Date>(new Date());
  
  useEffect(() => {
    // Set timezone to Turkey (GMT+3)
    const updateDate = () => {
      // Türkiye'nin GMT+3 saat dilimini oluşturuyoruz
      const now = new Date();
      // UTC zamanı al ve üzerine Türkiye için 3 saat ekle
      const turkeyDate = new Date(now.getTime() + (3 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60 * 1000));
      setDate(turkeyDate);
    };
    
    // Update immediately
    updateDate();
    
    // Set up interval for updates if needed
    if (mergedOptions.updateInterval && mergedOptions.updateInterval > 0) {
      const intervalId = setInterval(updateDate, mergedOptions.updateInterval);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [mergedOptions.updateInterval]);
  
  // Format date according to options
  let formattedDate = '';
  let formattedTime = '';
  
  // Get Turkish day name regardless of options
  const turkishDayOfWeek = turkishDays[date.getDay()];
  
  // Custom format or automatic format
  if (mergedOptions.formatString) {
    formattedDate = format(date, mergedOptions.formatString, { locale: tr });
  } else {
    // Date part
    if (!mergedOptions.timeOnly) {
      const dateFormatStr = mergedOptions.includeYear ? 'd MMMM yyyy' : 'd MMMM';
      formattedDate = format(date, dateFormatStr, { locale: tr });
    }
    
    // Time part
    if (mergedOptions.includeTime && !mergedOptions.dateOnly) {
      formattedTime = format(date, 'HH:mm', { locale: tr });
    }
  }
  
  return {
    date,
    formattedDate,
    formattedTime,
    turkishDayOfWeek,
    dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(), // 1-7 formatı (Pazartesi=1, Pazar=7)
    formatDate: (dateStr: string, formatStr: string = 'd MMMM yyyy') => 
      format(parseISO(dateStr), formatStr, { locale: tr }),
    getFormattedDate: () => {
      if (mergedOptions.timeOnly) return formattedTime;
      if (mergedOptions.dateOnly) return formattedDate;
      if (mergedOptions.includeDay) {
        return `${turkishDayOfWeek}, ${formattedDate} ${formattedTime}`;
      }
      return mergedOptions.includeTime ? `${formattedDate} ${formattedTime}` : formattedDate;
    },
    getDayOfWeek: () => date.getDay() === 0 ? 7 : date.getDay(), // 1-7 formatı (Pazartesi=1, Pazar=7)
    getTurkishDayName: () => turkishDays[date.getDay()],
  };
}
