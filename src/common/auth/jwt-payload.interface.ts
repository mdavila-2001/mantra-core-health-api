/**
 * Claims que la plataforma firma dentro del access token. `sub` es el id de
 * usuario; `sid` ancla el token a una sesión concreta para poder revocarlo en
 * `logout-all` y en la detección de reuso; `roles` evita un lookup por request.
 */
export interface JwtPayload {
  sub: string;
  sid?: string;
  roles: string[];
  /** Marca de tipo para distinguir access de otros usos futuros del secreto. */
  typ: 'access';
}
