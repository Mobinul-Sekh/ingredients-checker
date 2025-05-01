export function convertToIST(ms: string) {
  const timestamp = Number(ms);
  const date = new Date(timestamp);

  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    hour12: true, // or false for 24-hour format
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
