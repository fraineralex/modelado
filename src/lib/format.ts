export const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat('es-BO', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
export const formatHours = (value: number) => `${formatNumber(value, 2)} h`
