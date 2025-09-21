import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date: string | Date | undefined) {
  if (!date) return '';
  /*PPP는 포맷 토큰 
   P: 짧은 날짜 (예: 09/21/2025)

   PP: 긴 날짜 (예: Sep 21, 2025)

   PPP: 더 긴 날짜 (예: September 21st, 2025)

   PPPP: 가장 긴 날짜, 요일 포함 (예: Sunday, September 21st, 2025)
  */
  return format(new Date(date), 'PPP', { locale: ko });
}
