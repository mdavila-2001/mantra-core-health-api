import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que lee `VerifiedIdentityGuard`. */
export const REQUIRES_VERIFIED_IDENTITY_KEY = 'requiresVerifiedIdentity';

/**
 * Exige que el titular de la cuenta tenga su identidad verificada.
 *
 * Va por encima de `@Roles`, no en su lugar: el rol dice qué puede hacer una
 * cuenta, esto dice si sabemos quién está detrás de ella. Una funcionalidad
 * sensible (sacar una ficha médica, por ejemplo) necesita las dos cosas.
 *
 * Sin el decorador, el guard no impone nada — igual que `@Roles`.
 */
export const RequiresVerifiedIdentity = () =>
  SetMetadata(REQUIRES_VERIFIED_IDENTITY_KEY, true);
