import { SetMetadata } from '@nestjs/common';

/** Clave de metadata que marca un handler como accesible sin autenticación. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como público. El `JwtAuthGuard` global exige un token en
 * todo handler salvo los anotados con `@Public()` (login, refresh), evitando el
 * patrón inverso -y frágil- de tener que proteger cada ruta explícitamente.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
