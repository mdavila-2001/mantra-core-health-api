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
   * Códigos de rol de negocio con ámbito de tenant, indexados por el tenant en
   * el que fueron concedidos (MCH-001). Ver `AuthenticatedUser.scopedRoles`
   * para la semántica completa: un código ausente de este mapa es una
   * excepción global.
   */
  scopedRoles?: Record<string, string[]>;
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
   * Código de tipo de cada tenant de `tenants`, indexado por id
   * (`TenantTypeCode` de `directory.concepts.ts`: `'PAYER'`, `'PROVIDER'`,
   * `'PHARMACY'`…).
   *
   * Igual que `tenantNames`, es sólo dato de presentación —**no participa de
   * ninguna decisión de autorización**: quién puede hacer qué lo siguen
   * decidiendo `roles` y el tenant del request—. Existe porque el frontend
   * necesita saber si la organización activa es una aseguradora para recortar
   * su propio menú a lo que le corresponde, y el token es el único lugar de
   * donde puede sacarlo sin una ruta `/me`. Se omite por tenant cuyo
   * `tenant_type_concept_id` no esté en el catálogo.
   */
  tenantTypes?: Record<string, string>;
  /**
   * Perfil de paciente del titular de la cuenta, si tiene uno.
   *
   * Existe porque el autoservicio del portal lo NECESITA para operar -
   * `POST /scheduling/holds/:token/confirm` exige `patientProfileId`- y la única
   * lectura que lo devolvía (`GET /profiles/patients/me/summary`) estaba detrás
   * de `@RequiresVerifiedIdentity`: para reservar un turno había que estar
   * verificado, cuando la verificación es un trámite posterior e independiente.
   * Ese gate ya no existe (F-34), pero el claim se queda: operar con el token
   * que ya se tiene en la mano evita una lectura de más en cada confirmación.
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
  /**
   * Tipo de cuenta de quien inicia sesión: `ORGANIZATION` si alguna de sus
   * organizaciones (`tenants`) está en modo de cuenta de organización, `PERSON`
   * en cualquier otro caso. Lo gobierna el interruptor `org_account_mode` de
   * cada organización; sin él todo es `PERSON`.
   *
   * Es dato de presentación —el cliente decide qué menú mostrar— y **no
   * participa de ninguna decisión de autorización**.
   */
  accountKind?: 'PERSON' | 'ORGANIZATION';
  /** Tipo de cuenta de cada tenant de `tenants`, indexado por id (presentación). */
  tenantAccountKinds?: Record<string, 'PERSON' | 'ORGANIZATION'>;
  /**
   * Minutos de inactividad (5-480) tras los cuales el cliente cierra la sesión:
   * el menor plazo de las políticas de sesión que alcanzan a la persona. Se
   * omite si ninguna aplica. Es presentación: el cliente lo usa para su reloj y
   * **no autoriza nada**; la sesión la sigue gobernando el servidor.
   */
  idleTimeoutMinutes?: number;
  /**
   * Organizaciones de la persona que NO la dejan actuar ahora, con el motivo
   * estable (`OUTSIDE_ALLOWED_HOURS`, `OUTSIDE_ALLOWED_NETWORK`, `IDLE_TIMEOUT`,
   * `MFA_REQUIRED`, `MFA_ENROLLMENT_REQUIRED`). Esas organizaciones NO figuran en
   * `tenants` ni en `scopedRoles`: la política de una organización rige solo
   * cuando la persona actúa en ella, y no le cierra la sesión en las demás.
   * Una petición con `X-Tenant-Id` de una de ellas recibe 403 con ese motivo.
   */
  deniedTenants?: Record<string, string>;
  /**
   * `true` en el token de alcance limitado: la persona debe dar de alta un
   * segundo factor antes de usar la API. Solo deja pasar `/iam/me/mfa*`,
   * `/iam/auth/logout`, el refresco y `GET /iam/me`; el refresco lo conserva y
   * lo reemite completo al confirmar el factor.
   */
  mfaEnrollment?: true;
  /** Marca de tipo para distinguir access de otros usos futuros del secreto. */
  typ: 'access';
}
