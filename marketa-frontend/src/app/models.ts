export interface Product {
  id: number;
  name: string;
  price: string; // В Django Decimal обычно передается строкой
  category: string;
  owner: string;
}