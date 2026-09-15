// datetime-local inputs want "yyyy-MM-ddTHH:mm" in the browser's local time zone.
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromLocalInputValue(value: string): Date {
  return new Date(value)
}

// The backend stores/returns naive UTC timestamps (no trailing Z). Normalize before
// building a Date so it isn't misread as local time.
export function toUtcIso(date: Date): string {
  return date.toISOString().replace('Z', '')
}

export function parseBackendTimestamp(value: string): Date {
  return new Date(value.endsWith('Z') ? value : `${value}Z`)
}
