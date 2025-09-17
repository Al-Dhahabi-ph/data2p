import { format, isToday } from 'date-fns';

export const getCurrentDayName = (): string => {
  return format(new Date(), 'EEEE');
};

export const isCurrentDay = (date: Date): boolean => {
  return isToday(date);
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const getCurrentDayOfWeek = (): number => {
  return new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
};