import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or Date object to American format (MM/DD/YYYY)
 * @param dateInput - Date string, Date object, or null/undefined
 * @param includeTime - Whether to include time in the format
 * @returns Formatted date string in American format, or empty string if invalid
 */
export const formatDateToAmerican = (dateInput: string | Date | null | undefined, includeTime = false): string => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    if (includeTime) {
      return date.toLocaleString('en-US');
    } else {
      return date.toLocaleDateString('en-US');
    }
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
};

/**
 * Formats a date string or Date object to American format with time (MM/DD/YYYY, HH:MM:SS AM/PM)
 * @param dateInput - Date string, Date object, or null/undefined
 * @returns Formatted date string with time in American format
 */
export const formatDateTimeToAmerican = (dateInput: string | Date | null | undefined): string => {
  return formatDateToAmerican(dateInput, true);
};
