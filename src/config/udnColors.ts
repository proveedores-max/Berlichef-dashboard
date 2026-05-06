export const UDN_COLORS: Record<string, string> = {
  'Berlini':         '#3B82F6',
  'Shibana':         '#8B5CF6',
  'Fabrica':         '#10B981',
  'Altum Primaria':  '#F59E0B',
  'Altum Prepa':     '#EC4899',
  'Pequeno Gigante': '#14B8A6',
}

export function getUDNColor(udn: string): string {
  return UDN_COLORS[udn] ?? '#6B7280'
}
