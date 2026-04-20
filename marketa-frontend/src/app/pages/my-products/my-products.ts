import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category, Product, ProductCreatePayload, SellerStats } from '../../models';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth.service';
import {
  extractApiError,
  formatPrice,
  isNonNegativeNumber,
  productImageUrl,
} from '../../shared/ui-utils';

type ProductForm = ProductCreatePayload & {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: number | null;
  is_active: boolean;
};

type ProductEditForm = ProductForm & {
  id: number;
  image: File | null;
  imagePreview: string;
};

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-products.html',
  styleUrl: './my-products.css',
})
export class MyProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly formatPrice = formatPrice;
  readonly productImageUrl = productImageUrl;

  products: Product[] = [];
  categories: Category[] = [];
  stats: SellerStats | null = null;
  selectedImage: File | null = null;
  imagePreview = '';
  message = '';
  errorMessage = '';
  saving = false;
  loading = false;
  editingProductId: number | null = null;
  editForm: ProductEditForm | null = null;
  updatingProductIds = new Set<number>();
  form = this.getEmptyForm();

  private lastValidCreateForm = { ...this.form };
  private lastValidEditForm: ProductEditForm | null = null;
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    if (!this.auth.canSell()) {
      return;
    }

    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.cdr.detectChanges();

    this.api
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.cdr.detectChanges();
        },
      });

    this.api
      .getSellerStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.products = stats.products;
          this.loading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.showError('Не удалось загрузить ваши товары.');
        },
      });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedImage = file;
    this.imagePreview = file ? URL.createObjectURL(file) : '';
  }

  onEditImageSelected(event: Event) {
    if (!this.editForm) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.editForm.image = file;
    this.editForm.imagePreview = file ? URL.createObjectURL(file) : this.editForm.imagePreview;
  }

  validateCreateName() {
    this.validateTextField(this.form, this.lastValidCreateForm, 'name', 'название не может быть пустым');
  }

  validateCreateDescription() {
    this.validateTextField(this.form, this.lastValidCreateForm, 'description', 'описание не может быть пустым');
  }

  validateCreatePrice() {
    this.validateNumberField(this.form, this.lastValidCreateForm, 'price', 'цена не может быть меньше нуля');
  }

  validateCreateQuantity() {
    this.validateNumberField(this.form, this.lastValidCreateForm, 'quantity', 'количество не может быть меньше нуля');
  }

  validateEditName() {
    if (!this.editForm || !this.lastValidEditForm) {
      return;
    }

    this.validateTextField(this.editForm, this.lastValidEditForm, 'name', 'название не может быть пустым');
  }

  validateEditDescription() {
    if (!this.editForm || !this.lastValidEditForm) {
      return;
    }

    this.validateTextField(this.editForm, this.lastValidEditForm, 'description', 'описание не может быть пустым');
  }

  validateEditPrice() {
    if (!this.editForm || !this.lastValidEditForm) {
      return;
    }

    this.validateNumberField(this.editForm, this.lastValidEditForm, 'price', 'цена не может быть меньше нуля');
  }

  validateEditQuantity() {
    if (!this.editForm || !this.lastValidEditForm) {
      return;
    }

    this.validateNumberField(this.editForm, this.lastValidEditForm, 'quantity', 'количество не может быть меньше нуля');
  }

  createProduct() {
    this.message = '';
    this.errorMessage = '';

    if (!this.form.name.trim()) {
      this.showError('название не может быть пустым');
      return;
    }

    if (!this.form.description.trim()) {
      this.showError('описание не может быть пустым');
      return;
    }

    if (!this.form.category) {
      this.showError('Выберите категорию товара.');
      return;
    }

    if (!this.validateNonNegative(this.form.price, 'цена')) {
      return;
    }

    if (!this.validateNonNegative(this.form.quantity, 'количество')) {
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    this.api
      .createProduct(this.form, this.selectedImage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdProduct) => {
          this.message = 'Товар создан.';
          this.form = this.getEmptyForm();
          this.lastValidCreateForm = { ...this.form };
          this.selectedImage = null;
          this.imagePreview = '';
          this.saving = false;
          this.products = [createdProduct, ...this.products];
          this.stats = this.stats
            ? {
                ...this.stats,
                products_count: this.stats.products_count + 1,
                products: [createdProduct, ...this.stats.products],
              }
            : {
                products_count: 1,
                sold_quantity: 0,
                sold_value: 0,
                products: [createdProduct],
              };
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.saving = false;
          this.showError(extractApiError(error) || 'Не удалось создать товар.');
        },
      });
  }

  startEdit(product: Product) {
    this.message = '';
    this.errorMessage = '';
    this.editingProductId = product.id;
    this.editForm = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      quantity: product.quantity,
      category: product.category,
      is_active: product.is_active,
      image: null,
      imagePreview: this.productImageUrl(product) || '',
    };
    this.lastValidEditForm = { ...this.editForm };
    this.cdr.detectChanges();
  }

  cancelEdit() {
    this.editingProductId = null;
    this.editForm = null;
    this.lastValidEditForm = null;
    this.cdr.detectChanges();
  }

  saveEdit() {
    if (!this.editForm) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    if (!this.editForm.name.trim()) {
      this.showError('название не может быть пустым');
      return;
    }

    if (!this.editForm.description.trim()) {
      this.showError('описание не может быть пустым');
      return;
    }

    if (!this.editForm.category) {
      this.showError('Выберите категорию товара.');
      return;
    }

    if (!this.validateNonNegative(this.editForm.price, 'цена')) {
      return;
    }

    if (!this.validateNonNegative(this.editForm.quantity, 'количество')) {
      return;
    }

    const { id, image, imagePreview, ...payload } = this.editForm;
    this.patchProduct(id, payload, 'Карточка товара обновлена.', image, () => this.cancelEdit());
  }

  isUpdating(productId: number) {
    return this.updatingProductIds.has(productId);
  }

  private patchProduct(
    productId: number,
    payload: Partial<ProductCreatePayload>,
    successMessage: string,
    image?: File | null,
    onSuccess?: () => void
  ) {
    this.message = '';
    this.errorMessage = '';
    this.updatingProductIds = new Set(this.updatingProductIds).add(productId);
    this.cdr.detectChanges();

    this.api
      .updateProduct(productId, payload, image)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedProduct) => {
          this.products = this.products.map((product) => (product.id === productId ? updatedProduct : product));
          this.stats = this.stats
            ? {
                ...this.stats,
                products: this.stats.products.map((product) => (product.id === productId ? updatedProduct : product)),
              }
            : this.stats;
          this.message = successMessage;
          this.clearUpdating(productId);
          onSuccess?.();
        },
        error: (error) => {
          this.showError(extractApiError(error) || 'Не удалось обновить товар.');
          this.clearUpdating(productId);
        },
      });
  }

  private validateTextField<T extends ProductForm>(
    target: T,
    lastValid: T,
    field: 'name' | 'description',
    errorText: string
  ) {
    const value = target[field];

    if (!value.trim()) {
      target[field] = lastValid[field];
      this.showError(errorText);
      return;
    }

    target[field] = value;
    lastValid[field] = value;
    this.clearError();
  }

  private validateNumberField<T extends ProductForm>(
    target: T,
    lastValid: T,
    field: 'price' | 'quantity',
    errorText: string
  ) {
    const value = target[field];
    const numericValue = Number(value);

    if (!isNonNegativeNumber(numericValue)) {
      target[field] = lastValid[field];
      this.showError(errorText);
      return;
    }

    target[field] = numericValue;
    lastValid[field] = numericValue;
    this.clearError();
  }

  private validateNonNegative(value: number, label: string) {
    if (!isNonNegativeNumber(value)) {
      this.showError(`${label} не может быть меньше нуля`);
      return false;
    }

    return true;
  }

  private showError(message: string) {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }

    this.message = '';
    this.errorMessage = message;
    this.cdr.detectChanges();

    this.errorTimer = setTimeout(() => {
      this.errorMessage = '';
      this.errorTimer = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  private clearError() {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }

    if (this.errorMessage) {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }
  }

  private clearUpdating(productId: number) {
    const nextIds = new Set(this.updatingProductIds);
    nextIds.delete(productId);
    this.updatingProductIds = nextIds;
    this.cdr.detectChanges();
  }

  private getEmptyForm(): ProductForm {
    return {
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      category: null,
      is_active: true,
    };
  }
}
