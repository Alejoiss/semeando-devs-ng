export function dateInputToExpiration(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
}

export function expirationToDateInput(date: Date | null): string {
    if (!date) {
        return '';
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
