// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export const LEVEL_MAP: Record<string, { label: string; class: string }> = {
  BEGINNER:     { label: 'Beginner',     class: 'badge-green'  },
  INTERMEDIATE: { label: 'Intermediate', class: 'badge-yellow' },
  ADVANCED:     { label: 'Advanced',     class: 'badge-purple' },
};
