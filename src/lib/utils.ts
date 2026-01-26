import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

// Obtener fecha local en formato YYYY-MM-DD (evita problemas de zona horaria)
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convertir string YYYY-MM-DD a Date en zona horaria local (no UTC)
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function calcularMinutosRetraso(
  horaEntrada: Date,
  horarioEntrada: string
): number {
  const [horas, minutos] = horarioEntrada.split(":").map(Number);
  const horarioEsperado = new Date(horaEntrada);
  horarioEsperado.setHours(horas, minutos, 0, 0);

  const diferencia = horaEntrada.getTime() - horarioEsperado.getTime();
  const minutosRetraso = Math.floor(diferencia / 60000);

  return minutosRetraso > 0 ? minutosRetraso : 0;
}

export function obtenerFechaSemana(fecha: Date = new Date()): {
  inicio: Date;
  fin: Date;
} {
  const dia = fecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia; // Lunes como inicio

  const inicio = new Date(fecha);
  inicio.setDate(fecha.getDate() + diferencia);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  fin.setHours(23, 59, 59, 999);

  return { inicio, fin };
}
