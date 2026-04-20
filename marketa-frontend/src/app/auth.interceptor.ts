import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';

const isPublicCatalogRequest = (method: string, url: string) => {
  if (method !== 'GET') {
    return false;
  }

  const path = url.split('?')[0];

  return (
    path.includes('/api/categories/') ||
    path.includes('/api/stats/') ||
    /\/api\/products\/?$/.test(path) ||
    /\/api\/products\/\d+\/?$/.test(path)
  );
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicCatalogRequest(req.method, req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getAccessToken();

  const request = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (token && error.status === 401) {
        auth.clearSession();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
