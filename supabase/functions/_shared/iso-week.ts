export function isoWeek(date: Date): { week: number; year: number } {
    const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7))
    const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
    const week = Math.ceil(((thursday.getTime() - yearStart) / 86400000 + 1) / 7)
    return { week, year: thursday.getUTCFullYear() }
}
