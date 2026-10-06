export const formatDate = (date: Date) => date.toISOString();
export const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;