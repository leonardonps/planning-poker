import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";

export const sessaoGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {    
    const router = inject(Router);
    const sessaoId = sessionStorage.getItem('sessaoId');
    
    if (sessaoId && sessaoId !== route.params['id']) return router.createUrlTree(['/sessao', sessaoId]);

    return true;
}