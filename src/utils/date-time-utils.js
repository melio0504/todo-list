import { format } from 'date-fns';

/**
@returns {Array<{value: string, label: string}>}
 */
export function generateTimeOptions() {
  const times = [];

  for (let hour = 1; hour <= 11; hour++) {
    const value = `${String(hour).padStart(2, '0')}:00`;
    times.push({ value, label: `${hour}:00 AM` });
  }

  times.push({ value: '12:00', label: '12:00 PM' });

  for (let hour = 1; hour <= 11; hour++) {
    const value = `${String(hour + 12).padStart(2, '0')}:00`;
    times.push({ value, label: `${hour}:00 PM` });
  }

  times.push({ value: '00:00', label: '12:00 AM' });
  return times;
}

/**
 * @param {string} dateStr
 * @param {string} timeStr
 * @param {boolean} allDay
 * @returns {string}
 */
export function formatDeadlineFromDate(dateStr, timeStr, allDay) {
  if (!dateStr) return 'No date';

  let dateObj;
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/');
    dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  } else {
    dateObj = new Date(dateStr);
  }
  
  if (isNaN(dateObj.getTime())) return 'No date';
  
  return format(dateObj, 'EEE, MMM d');
}

/**
 * @param {string} date
 * @param {string} time
 * @param {boolean} allDay
 * @returns {string}
 */
export function formatDateTime(date, time, allDay) {
  if (!date) {
    return 'No date';
  }
  
  const dateObj = new Date(date);
  
  return format(dateObj, 'EEE, MMM d');
}

/**
 * @param {string} timeStr
 * @returns {string|null}
 */
export function convertTimeFormat(timeStr) {
  if (!timeStr || timeStr === 'N/A') return null;
  
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3] ? match[3].toLowerCase() : '';
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  
  return null;
}

/**
 * @param {string} timeStr
 * @returns {string|null}
 */
export function formatTimeTo12Hour(timeStr) {
  if (!timeStr || timeStr === 'N/A') return null;
  
  if (/am|pm/i.test(timeStr)) {
    return timeStr;
  }
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return timeStr;
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? 'pm' : 'am';
  
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours = hours - 12;
  }
  
  return `${hours}:${minutes}${period}`;
}
