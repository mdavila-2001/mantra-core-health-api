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
  /**
   * Nombre para mostrar del usuario.
   *
   * Va en el token y no en una ruta `/me` a propósito: es un campo más de algo
   * que el cliente ya recibe, así que no reintroduce la petición por request que
   * la ausencia de `/me` evita. Sin él la interfaz sólo podía mostrar el `sub`
   * acortado —«Usuario dc0c455f»—, que es cierto y no es un nombre.
   */
  name?: string;
  /**
   * Nombre de cada tenant de `tenants`, indexado por id.
   *
   * `tenants` sigue siendo una lista de uuid porque es lo que valida el
   * interceptor de tenant; esto es sólo para poder mostrarlos. Sin esto, quien
   * pertenece a más de una organización tenía que elegir entre identificadores,
   * y elegir mal significa mirar los datos de otra institución.
   */
  tenantNames?: Record<string, string>;
  /** Marca de tipo para distinguir access de otros usos futuros del secreto. */
  typ: 'access';
}
