import { Product } from '../models';
import { API_ORIGIN } from './app-constants';

export function formatPrice(price: string | number) {
  return new Intl.NumberFormat('ru-RU').format(Number(price));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function productImageUrl(product: Product) {
  const url = product.image_url || product.image;

  if (!url) {
    return null;
  }

  if (url.startsWith('http')) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

export function extractApiError(error: any) {
  const response = error?.error;

  if (!response) {
    return '';
  }

  if (typeof response === 'string') {
    return response;
  }

  if (response.error) {
    return response.error;
  }

  const firstKey = Object.keys(response)[0];
  const firstValue = firstKey ? response[firstKey] : null;

  if (Array.isArray(firstValue)) {
    return firstValue[0];
  }

  return typeof firstValue === 'string' ? firstValue : '';
}

export function isNonNegativeNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}
