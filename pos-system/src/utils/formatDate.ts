import { format } from 'date-fns'

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy HH:mm') => {
  return format(new Date(date), formatStr)
}

export const formatDateShort = (date: string | Date) => {
  return format(new Date(date), 'dd/MM/yyyy')
}
