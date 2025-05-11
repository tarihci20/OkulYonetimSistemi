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
  includeDay: false,
  dateOnly: false,
  timeOnly: false,
};

export function useTurkishDate(options: TurkishDateOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [date, setDate] = useState<Date>(new Date());
  
  useEffect(() => {
    // Set timezone to Turkey
    const updateDate = () => {
      const turkeyDate = new Date();
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
  let dayOfWeek = '';
  
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
    
    // Day of week part
    if (mergedOptions.includeDay) {
      dayOfWeek = turkishDays[date.getDay()];
    }
  }
  
  return {
    date,
    formattedDate,
    formattedTime,
    dayOfWeek,
    formatDate: (dateStr: string, formatStr: string = 'd MMMM yyyy') => 
      format(parseISO(dateStr), formatStr, { locale: tr }),
    getFormattedDate: () => {
      if (mergedOptions.timeOnly) return formattedTime;
      if (mergedOptions.dateOnly) return formattedDate;
      if (mergedOptions.includeDay) {
        return `${dayOfWeek}, ${formattedDate} ${formattedTime}`;
      }
      return mergedOptions.includeTime ? `${formattedDate} ${formattedTime}` : formattedDate;
    },
    getDayOfWeek: () => date.getDay(),
    getTurkishDayName: () => turkishDays[date.getDay()],
  };
}
