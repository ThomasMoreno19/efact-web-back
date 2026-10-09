const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

export function currentArgentinaDateAsUtcDate(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
}
