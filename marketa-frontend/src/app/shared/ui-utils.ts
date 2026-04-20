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
    return translateApiError(response);
  }

  if (response.error) {
    return translateApiError(response.error);
  }

  const firstKey = Object.keys(response)[0];
  const firstValue = firstKey ? response[firstKey] : null;

  if (Array.isArray(firstValue)) {
    return translateApiError(firstValue[0], firstKey);
  }

  return typeof firstValue === 'string' ? translateApiError(firstValue, firstKey) : '';
}

export function isNonNegativeNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function translateApiError(message: string, fieldName = '') {
  const stockMatch = message.match(/^Not enough stock for (.+)\.$/);

  if (stockMatch) {
    return `Недостаточно товара на складе: ${stockMatch[1]}.`;
  }

  const minLengthMatch = message.match(/^Ensure this field has at least (\d+) characters\.$/);

  if (minLengthMatch) {
    return `${fieldLabel(fieldName)} должен быть не короче ${minLengthMatch[1]} символов.`;
  }

  const maxLengthMatch = message.match(/^Ensure this field has no more than (\d+) characters\.$/);

  if (maxLengthMatch) {
    return `${fieldLabel(fieldName)} должен быть не длиннее ${maxLengthMatch[1]} символов.`;
  }

  const translations: Record<string, string> = {
    'Cart is empty.': 'Корзина пуста.',
    'Cart item not found.': 'Позиция корзины не найдена.',
    'Invalid or missing token': 'Сессия устарела. Войдите снова.',
    'Only sellers can publish products.': 'Только продавцы могут публиковать товары.',
    'Only sellers can view sales history.': 'История продаж доступна только продавцам.',
    'Only sellers can view sales stats.': 'Статистика продаж доступна только продавцам.',
    'Product not found.': 'Товар не найден.',
    'Product not found': 'Товар не найден.',
    'Quantity must be a number.': 'Количество должно быть числом.',
    'Quantity must be at least 1.': 'Количество должно быть не меньше 1.',
    'A user with this username already exists.': 'Пользователь с таким логином уже существует.',
    'Price cannot be negative.': 'Цена не может быть меньше нуля.',
    'Quantity cannot be negative.': 'Количество не может быть меньше нуля.',
    'This field may not be blank.': `${fieldLabel(fieldName)} не может быть пустым.`,
    'This field is required.': `Заполните поле: ${fieldLabel(fieldName).toLowerCase()}.`,
    'Enter a valid email address.': 'Введите корректную почту.',
    'Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.': 'Логин может содержать только буквы, цифры и символы @ . + - _',
  };

  return translations[message] || message;
}

function fieldLabel(fieldName: string) {
  const labels: Record<string, string> = {
    username: 'Логин',
    email: 'Почта',
    first_name: 'Имя',
    last_name: 'Фамилия',
    password: 'Пароль',
    role: 'Роль',
    name: 'Название',
    description: 'Описание',
    price: 'Цена',
    quantity: 'Количество',
    category: 'Категория',
  };

  return labels[fieldName] || 'Поле';
}
