/**
 * Claims que la plataforma firma dentro del access token. `sub` es el id de
 * usuario; `sid` ancla el token a una sesión concreta para poder revocarlo en
 * `logout-all` y en la detección de reuso; `roles` evita un lookup por request.
 */
export interface JwtPayload {
  /**
   * Valor de sub mantenido por la instancia.
   */
  sub: string;
  /**
   * Valor de sid mantenido por la instancia.
   */
  sid?: string;
  /**
   * Valor de roles mantenido por la instancia.
   */
  roles: string[];
  /**
   * Tenants (organizaciones) de los que el usuario es miembro activo. El request
   * elige uno vía cabecera `X-Tenant-Id`, que debe pertenecer a esta lista; así
   * el scoping por tenant (RLS) no requiere un lookup por request.
   */
  tenants?: string[];
  /** Marca de tipo para distinguir access de otros usos futuros del secreto. */
  typ: 'access';
}
