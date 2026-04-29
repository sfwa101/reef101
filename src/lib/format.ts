// Force any number / string with Arabic-Indic digits to Latin (Western) digits.
const arabicIndic = /[\u0660-\u0669\u06F0-\u06F9]/g;
const map: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

export const toLatin = (input: string | number | null | undefined): string => {
  if (input === null || input === undefined) return "";
  return String(input).replace(arabicIndic, (d) => map[d] ?? d);
};

export const fmtMoney = (n: number | null | undefined) =>
  `${toLatin(Math.round(Number(n ?? 0)))} ج.م`;

export const fmtNum = (n: number | null | undefined) =>
  toLatin(Number(n ?? 0).toLocaleString("en-US"));

export const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(typeof d === "string" ? new Date(d) : d);

export const fmtRelative = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  if (diff < 2592000) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return fmtDate(date);
};
