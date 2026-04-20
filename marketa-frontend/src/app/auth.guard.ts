import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  return auth.restoreSession().pipe(
    map((user) => user ? true : router.createUrlTree(['/login']))
  );
};

export const loginRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.getAccessToken()) {
    return true;
  }

  return auth.restoreSession().pipe(
    map((user) => user ? router.createUrlTree(['/products']) : true)
  );
};
