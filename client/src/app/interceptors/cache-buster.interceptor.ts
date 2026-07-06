import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepteur HTTP qui ajoute un timestamp a chaque requete API
 * pour eviter les problemes de cache navigateur
 */
export const cacheBusterInterceptor: HttpInterceptorFn = (req, next) => {
    // Ne pas modifier les requetes vers des ressources statiques (images, etc.)
    if (req.url.includes('/image/') || req.url.includes('.js') || req.url.includes('.css')) {
        return next(req);
    }

    // Ajouter un timestamp pour forcer le navigateur a ne pas utiliser le cache
    const timestamp = Date.now();
    const separator = req.url.includes('?') ? '&' : '?';
    const noCacheReq = req.clone({
        url: `${req.url}${separator}_t=${timestamp}`,
    });

    return next(noCacheReq);
};
