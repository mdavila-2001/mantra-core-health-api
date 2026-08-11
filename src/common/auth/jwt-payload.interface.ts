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
  /**
   * Perfil de paciente del titular de la cuenta, si tiene uno.
   *
   * Existe porque el autoservicio del portal lo NECESITA para operar -
   * `POST /scheduling/holds/:token/confirm` exige `patientProfileId`- y la única
   * lectura que lo devolvía (`GET /profiles/patients/me/summary`) está detrás de
   * `@RequiresVerifiedIdentity`. O sea: para reservar un turno había que estar
   * verificado, cuando la verificación es un trámite posterior e independiente.
   * El paciente quedaba encerrado en un círculo.
   *
   * **No es una credencial ni participa de ninguna decisión de autorización:**
   * quién puede confirmar una cita lo siguen decidiendo `roles` y el tenant del
   * request. Es el mismo dato que el registro ya devuelve en su respuesta, puesto
   * donde sobreviva a un refresco de sesión.
   */
  pid?: string;
  /**
   * Perfil profesional del titular de la cuenta (`health_practitioner_profiles`).
   *
   * El simétrico de `pid` para el otro lado del mostrador, y existe por una razón
   * parecida: **la agenda de un profesional no se podía identificar.**
   * `GET /scheduling/resources` devuelve `resourceRefType` y `resourceRefId` —un
   * consultorio declara de qué profesional es—, pero la sesión no conocía su
   * propio perfil, así que el portal no podía saber cuál de todas las agendas de
   * la organización era la suya. Caía en la primera de la lista, que con varios
   * consultorios sembrados es la de otra persona.
   *
   * No hay lectura que lo devuelva: `profiles-practitioners.controller.ts` sólo
   * expone `POST`, y no hay un `me` como el de paciente. Firmarlo acá lo resuelve
   * sin agregar una petición a cada arranque de sesión.
   *
   * **No es una credencial y no participa de ninguna decisión de autorización**,
   * igual que `pid`: quién puede ver una agenda lo siguen decidiendo `roles` y el
   * tenant del request. Es un dato de identificación, no un permiso.
   *
   * Se omite en toda cuenta que no tenga perfil profesional: pacientes,
   * administradores, cuentas de sistema.
   */
  hpid?: string;
  /** Marca de tipo para distinguir access de otros usos futuros del secreto. */
  typ: 'access';
}
