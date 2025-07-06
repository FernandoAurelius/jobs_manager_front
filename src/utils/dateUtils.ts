import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'
import { debugLog } from '@/utils/debug'

export function toDateValue(date: Date | string | null | undefined): DateValue | undefined {
  if (!date) {
    return undefined
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return undefined
  }
  try {
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()

    return new CalendarDate(year, month, day)
  } catch (error) {
    debugLog('Failed to convert date to DateValue:', error)
    return undefined
  }
}

export function fromDateValue(dateValue: DateValue | null | undefined): Date | null {
  if (!dateValue) {
    return null
  }

  try {
    return new Date(dateValue.year, dateValue.month - 1, dateValue.day)
  } catch (error) {
    debugLog('Failed to convert DateValue to Date:', error)
    return null
  }
}
