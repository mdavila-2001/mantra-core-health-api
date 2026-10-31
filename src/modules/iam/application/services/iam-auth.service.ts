import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  APP_ATTR,
  TracingService,
  type TraceSpan,
} from '../../../../observability';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  TokenService,
  loadAuthEnv,
  touch,
  withSystemRead,
  type AuthEnv,
  type AuthenticatedUser,
} from '../../../../common';
import {
  UsersRepository,
  CredentialsRepository,
  SessionsRepository,
  RefreshTokensRepository,
  UserGlobalRolesRepository,
  AccountLockoutsRepository,
  SecurityEventsRepository,
  MfaFactorsRepository,
} from '../../infrastructure/repositories';
import {
  LoginDto,
  TokenResponseDto,
  LogoutAllResultDto,
  LogoutResultDto,
  PurgeResultDto,
} from '../../presentation/dto';
import { conceptIdsToRoleCodes } from './role-mapping';
import {
  idleTimeoutClaim,
  ttlToMinutes,
  violationsByTenant,
  type EffectiveSessionRules,
  type SessionPolicyViolation,
  type TenantAccessDenial,
} from '../../domain/session-policy';
import { everyTenantDenied, withoutTenants } from '../../domain/tenant-gate';
import { IamTotpService } from './iam-totp.service';
import { StepUpStorePort } from '../ports/step-up-store.port';
import { SessionPoliciesService } from './session-policies.service';
import { IpAccessRulesService } from './ip-access-rules.service';
import {
  IamDeviceRecognitionService,
  type DeviceRecognition,
} from './iam-device-recognition.service';
import {
  SUPPORT_CLAIMS_PORT,
  type SupportClaimsPort,
} from '../ports/support-claims.port';
import {
  ACCOUNT_PROFILE_IDS_PORT,
  type AccountProfileIdsPort,
} from '../ports/account-profile-ids.port';
import {
  BUSINESS_ROLES_PORT,
  type BusinessRolesPort,
} from '../ports/business-roles.port';
import {
  TENANT_CLAIMS_PORT,
  type TenantClaimsPort,
} from '../ports/tenant-claims.port';

/**
 * Flujos de autenticación de sesión: login (UC-01-04), rotación de tokens con
 * detección de reuso (UC-01-06), cierre global de sesión (UC-01-08) y purga de
 * sesiones vencidas (UC-01-11).
 *
 * Los efectos de un login fallido (evento de seguridad, contador y posible
 * bloqueo) se confirman en su propia transacción ANTES de lanzar el error, para
 * que no se reviertan con el `throw`.
 */
/** Resultado de la transacción de rotación; las excepciones se lanzan fuera. */
type RefreshOutcome =
  | { kind: 'rotated'; tokens: TokenResponseDto }
  | { kind: 'reuse' }
  | { kind: 'expired' }
  | { kind: 'policy'; violation: SessionPolicyViolation }
  | { kind: 'invalid' };

/**
 * El personal de una farmacia no tiene un rol global de plataforma: su
 * autoridad nace de una membresía activa en un tenant de tipo `PHARMACY`. Se
 * materializa como el rol de runtime `PHARMACY_STAFF` para que `@Roles` pueda
 * nombrarlo; el aislamiento entre farmacias lo siguen dando el tenant del
 * request y `PharmacyTenantScopeGuard`.
 */
function withPharmacyStaffRole(
  roles: string[],
  tenantTypes: Record<string, string>,
): string[] {
  return Object.values(tenantTypes).includes('PHARMACY')
    ? [...new Set([...roles, 'PHARMACY_STAFF'])]
    : roles;
}

/** Rol de runtime de quien tiene un vínculo de apoyo activo; ver `agenda-actors`. */
const SUPPORT_STAFF_ROLE = 'SUPPORT_STAFF';

/**
 * El personal de apoyo no tiene un rol global asignado a mano: su autoridad
 * nace de un vínculo de apoyo activo con una organización. Se materializa como
 * el rol de runtime `SUPPORT_STAFF`, acotado a esas organizaciones, para que
 * `@Roles` pueda nombrarlo. Qué puede hacer lo decide la política de apoyo,
 * permiso por permiso, no este rol.
 */
function withSupportStaffRole(
  roles: string[],
  scopedRoles: Record<string, string[]>,
  supportTenantIds: readonly string[],
): { roles: string[]; scopedRoles: Record<string, string[]> } {
  if (supportTenantIds.length === 0) return { roles, scopedRoles };
  const scoped: Record<string, string[]> = { ...scopedRoles };
  for (const tenantId of supportTenantIds) {
    scoped[tenantId] = [
      ...new Set([...(scoped[tenantId] ?? []), SUPPORT_STAFF_ROLE]),
    ];
  }
  return {
    roles: [...new Set([...roles, SUPPORT_STAFF_ROLE])],
    scopedRoles: scoped,
  };
}

/** Las organizaciones que niegan, como lista para la respuesta del login y del refresco. */
function toDeniedList(
  denied: Readonly<Record<string, TenantAccessDenial>>,
): { tenantId: string; reason: TenantAccessDenial }[] {
  return Object.entries(denied).map(([tenantId, reason]) => ({
    tenantId,
    reason,
  }));
}

@Injectable()
export class IamAuthService {
  /**
   * Valor de auth env mantenido por la instancia.
   */
  private readonly authEnv: AuthEnv = loadAuthEnv();

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenService - Valor de token service requerido por la operación.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param sessionsRepo - Valor de sessions repo requerido por la operación.
   * @param refreshRepo - Valor de refresh repo requerido por la operación.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param lockoutsRepo - Valor de lockouts repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param effectiveRoles - Roles de negocio vigentes del sujeto (`authz`).
   * @param accountLinksRepo - Vínculo cuenta-persona del titular.
   * @param patientProfilesRepo - Perfil de paciente del titular.
   * @param logger - Valor de logger requerido por la operación.
   * @param mfaRepo - Factores MFA, para el desafío de `AUTH_MFA_CHALLENGE_ENABLED`.
   * @param sessionPolicies - Políticas de sesión de las organizaciones del titular.
   * @param supportClaims - Vínculos de apoyo activos del titular.
   * @param ipRules - Reglas de red de las organizaciones (`enforceIpRules`).
   * @param deviceRecognition - Reconocimiento del dispositivo de la sesión.
   * @param totp - Verificación de códigos TOTP de un solo uso.
   * @param stepUp - Sello del paso extra por sesión (se borra al cerrar sesión).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly refreshRepo: RefreshTokensRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly lockoutsRepo: AccountLockoutsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    @Inject(BUSINESS_ROLES_PORT)
    private readonly effectiveRoles: BusinessRolesPort,
    @Inject(ACCOUNT_PROFILE_IDS_PORT)
    private readonly profileIds: AccountProfileIdsPort,
    @Inject(TENANT_CLAIMS_PORT)
    private readonly tenantClaims: TenantClaimsPort,
    private readonly logger: PinoLogger,
    private readonly tracing: TracingService,
    private readonly mfaRepo?: MfaFactorsRepository,
    private readonly sessionPolicies?: SessionPoliciesService,
    @Optional()
    @Inject(SUPPORT_CLAIMS_PORT)
    private readonly supportClaims?: SupportClaimsPort,
    private readonly ipRules?: IpAccessRulesService,
    private readonly deviceRecognition?: IamDeviceRecognitionService,
    private readonly totp?: IamTotpService,
    private readonly stepUp?: StepUpStorePort,
  ) {
    this.logger.setContext(IamAuthService.name);
  }

  /**
   * Tenants de los que el usuario es miembro ACTIVO. Se embeben en el token para
   * que el `X-Tenant-Id` del request pueda validarse sin un lookup por petición.
   *
   * Se filtra por DOS conceptos a propósito. El correcto es
   * `DIR.MEMBERSHIP_ACTIVE` (`directory:membership-status:active`), que es lo
   * que escribe todo `directory` — provisión de tenant, sub-tenant, invitación
   * de miembro. Este método, en cambio, filtraba sólo por
   * `CONCEPTS.MEMBERSHIP_ACTIVE`, que pese al nombre es
   * `promotions:membership-status:active`: la membresía de un programa de
   * fidelización, otra tabla y otro dominio. El resultado era que el owner de
   * una organización recién creada no veía su propio tenant en el claim y
   * `TenantContextInterceptor` le respondía 403 "no pertenece a ningún tenant"
   * en cada request posterior: la organización nacía inutilizable.
   *
   * El concepto de promotions se mantiene en el filtro porque las cuentas de
   * pacientes auto-registradas antes de este cambio tienen su membresía con ese
   * status; quitarlo las dejaría fuera de su tenant de un día para otro.
   */
  /**
   * Códigos de rol que viajan en el claim `roles`: los globales de
   * `iam.user_global_roles` más los de negocio vigentes en `authz`.
   *
   * Los dos catálogos son deliberadamente distintos. `iam` sólo conoce cuatro
   * códigos (`USER`, `PATIENT`, `SECURITY_ADMIN`, `SUPERADMIN`) porque son los
   * de la plataforma: no dependen de tenant ni caducan. Todo lo demás —los diez
   * actores clínicos, y cualquier rol que un administrador componga— vive en
   * `authz.roles` con tenant, vigencia y estado propios. Hasta que ambos se
   * unieron aquí, `@Roles('SURGEON')` era inalcanzable para cualquier sujeto que
   * no fuese `SUPERADMIN`, porque `conceptIdsToRoleCodes` descarta en silencio
   * todo código que no sea uno de los cuatro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Sujeto para el que se emite el token.
   * @param globalRoles - Filas activas de `iam.user_global_roles` ya leídas.
   * @returns Los códigos, sin repetir.
   */
  private async mergeRoleCodes(
    em: EntityManager,
    userId: string,
    globalRoles: { roleConceptId: string }[],
  ): Promise<{ roles: string[]; scopedRoles: Record<string, string[]> }> {
    const globalConceptIds = globalRoles.map((r) => r.roleConceptId);
    const global = conceptIdsToRoleCodes(globalConceptIds);
    // H1.S1.M3: `conceptIdsToRoleCodes` descarta en silencio todo concepto que
    // `ROLE_CODE_BY_CONCEPT` no declare (rol global agregado a `iam.user_global_roles`
    // sin agregarlo también a `role-mapping.ts`). El descarte en sí sigue siendo el
    // comportamiento correcto — no inventamos un código — pero que ocurra sin dejar
    // rastro es lo que costó el agujero de `PATIENT`/`PRACTITIONER`/`CLINICIAN` antes
    // de sembrarse. Un conteo divergente es evidencia suficiente sin necesitar mapear
    // cuál id exacto sobró.
    if (global.length < globalConceptIds.length) {
      this.logger.warn(
        {
          userId,
          operation: 'iam.auth.merge-role-codes',
          globalConceptCount: globalConceptIds.length,
          mappedCount: global.length,
        },
        'iam.user_global_roles referencia un role_concept_id que role-mapping.ts no declara: se descarta en vez de fallar el login, pero queda sin ejercer',
      );
    }
    // Una asignación de `authz` rota no debe impedir iniciar sesión: sin ella el
    // sujeto entra con sus roles de plataforma y recibe un 403 explícito al
    // tocar lo clínico, que es un fallo legible. Fallar el login entero
    // convertiría un problema de autorización en una caída de autenticación.
    const assignments = await this.effectiveRoles
      .scopedAssignmentsForUser(em, userId)
      .catch((error: unknown) => {
        this.logger.error(
          { err: error, userId, operation: 'iam.auth.effective-roles' },
          'No se pudieron resolver los roles de negocio del sujeto',
        );
        return [] as { code: string; tenantId?: string }[];
      });

    const business = assignments.map((a) => a.code);
    // MCH-001: sólo entra a `scopedRoles` la asignación que SÍ declara tenant.
    // Sin `tenantId` es una excepción global deliberada del propio modelo de
    // datos: queda en `roles` como siempre, sin ámbito que la restrinja.
    const scopedRoles: Record<string, string[]> = {};
    for (const a of assignments) {
      if (!a.tenantId) continue;
      (scopedRoles[a.tenantId] ??= []).push(a.code);
    }

    return {
      roles: [...new Set([...global, ...business])],
      scopedRoles,
    };
  }

  private async loadActiveTenantIds(
    em: EntityManager,
    userId: string,
  ): Promise<string[]> {
    return this.tenantClaims.listActiveTenantIds(em, userId);
  }

  /**
   * La autoridad de la persona que se autentica: sus roles (globales, de negocio
   * y de apoyo) y las organizaciones donde tiene membresía activa. Con RLS el
   * login y la renovación todavía no tienen organización activa, así que estas
   * lecturas (membresías, vínculos de apoyo y asignaciones de rol, todas filtradas
   * por `userId`) corren con el contexto de sistema abierto SOLO mientras duran.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona que se autentica.
   * @returns Roles, roles por organización y organizaciones activas.
   */
  private async loadAuthority(
    em: EntityManager,
    userId: string,
  ): Promise<{
    roles: string[];
    scopedRoles: Record<string, string[]>;
    tenants: string[];
  }> {
    return withSystemRead(em, async (db) => {
      const activeRoles = await this.rolesRepo.findActiveForUser(db, userId);
      const merged = await this.mergeRoleCodes(db, userId, activeRoles);
      const withSupport = withSupportStaffRole(
        merged.roles,
        merged.scopedRoles,
        (await this.supportClaims?.listTenantIdsWithActiveEngagement(
          db,
          userId,
        )) ?? [],
      );
      return {
        roles: withSupport.roles,
        scopedRoles: withSupport.scopedRoles,
        tenants: await this.loadActiveTenantIds(db, userId),
      };
    });
  }

  /**
   * Perfil de paciente del titular de la cuenta, para el claim `pid`.
   *
   * Recorre la misma cadena que `ProfilesPatientsService.getOwnSummary` -vínculo
   * activo cuenta-persona y de ahí el perfil, porque `patient_profiles.profile_id`
   * ES `persons.id`-, así que las dos vías responden siempre lo mismo.
   *
   * Va en el token porque el autoservicio del portal necesita el dato para
   * confirmar una cita, y la lectura de `profiles` exige identidad verificada:
   * sin esto, reservar un turno dependía de un trámite que ocurre después.
   * No es una credencial; ver `JwtPayload.pid`.
   *
   * Devuelve `undefined` -y el claim se omite- para toda cuenta que no sea la de
   * un paciente: personal de salud, administradores, cuentas de sistema.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Titular de la sesión que se está abriendo.
   * @returns El `patientProfileId`, o `undefined` si la cuenta no es de un paciente.
   */
  private async loadPatientProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | undefined> {
    return this.profileIds.findPatientProfileId(em, userId);
  }

  /**
   * Perfil profesional del titular de la cuenta, para el claim `hpid`.
   *
   * Misma cadena que el perfil de paciente —vínculo activo cuenta-persona y de
   * ahí el perfil, porque `health_practitioner_profiles.profile_id` ES
   * `persons.id`— sobre la otra tabla de perfil. Las dos conviven sin
   * excluirse: nada impide que quien atiende sea además paciente de la
   * institución, y en ese caso el token lleva los dos claims, cada uno con su
   * significado.
   *
   * Va en el token porque **no existe lectura que lo devuelva**: el controlador
   * de profesionales sólo expone `POST`. Sin esto, la agenda no puede saber cuál
   * de los recursos de la organización es el de quien inició sesión.
   * No es una credencial; ver `JwtPayload.hpid`.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Titular de la sesión que se está abriendo.
   * @returns El `profileId` profesional, o `undefined` si la cuenta no es de uno.
   */
  private async loadPractitionerProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | undefined> {
    return this.profileIds.findPractitionerProfileId(em, userId);
  }

  /**
   * Nombre y tipo de cada tenant, indexado por id, para los que el token va a
   * declarar.
   *
   * Sólo sirve para mostrarlos: `tenants` sigue siendo la lista de uuid que
   * valida el interceptor de tenant, y ninguno de los dos mapas participa de
   * ninguna decisión de autorización. El nombre existe porque quien pertenece
   * a más de una organización tenía que elegir entre identificadores, y elegir
   * mal significa mirar los datos de otra institución. El tipo existe porque
   * el frontend necesita saber si la organización activa es una aseguradora
   * para recortar su propio menú (`tenantTypes`, `JwtPayload`).
   *
   * Una sola consulta para los dos mapas: el tipo sale de la misma fila que ya
   * se lee para el nombre.
   *
   * Prefiere el nombre comercial sobre el legal, que es el que la gente
   * reconoce; el código queda de último recurso para que la lista nunca tenga
   * una entrada en blanco. Un `tenant_type_concept_id` que no esté en
   * {@link TENANT_TYPE_CODE_BY_CONCEPT_ID} (la columna admite cualquier uuid)
   * simplemente no tiene entrada en `tenantTypes`.
   *
   * @param em - Contexto de persistencia.
   * @param tenantIds - Tenants con membresía activa.
   * @returns Los mapas `id -> nombre` e `id -> código de tipo`.
   */
  private async loadTenantDisplay(
    em: EntityManager,
    tenantIds: string[],
  ): Promise<{
    tenantNames: Record<string, string>;
    tenantTypes: Record<string, string>;
    tenantAccountKinds?: Record<string, 'PERSON' | 'ORGANIZATION'>;
  }> {
    // `practice.practices` tiene RLS por organización: las del token son las
    // de las membresías activas de la persona (lectura acotada).
    return withSystemRead(em, (db) =>
      this.tenantClaims.describeTenants(db, tenantIds),
    );
  }

  /**
   * UC-01-04: autentica por identificador+contraseña y abre una sesión.
   *
   * El identificador es el `external_subject` de la credencial: el correo para
   * las altas por correo, el documento de identidad para los pacientes
   * auto-registrados. Ambos viven en la misma columna, así que la búsqueda es
   * idéntica; sólo cambia de qué campo del DTO sale.
   *
   * La política de sesión de una organización rige SOLO cuando la persona actúa
   * en ella: si una organización niega ahora (franja, red, segundo factor), esa
   * organización sale del token (`tenants`, `scopedRoles`) y se declara en
   * `deniedTenants` con su motivo; la persona entra a las demás. El login solo
   * se rechaza cuando ninguna organización la deja entrar.
   */
  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
    deviceCookie?: string,
  ): Promise<TokenResponseDto> {
    // Span de negocio: la autenticación es la operación con más caminos de
    // fallo distintos del sistema (sin credencial, usuario inactivo, contraseña
    // incorrecta, cuenta bloqueada) y todos devuelven el mismo 401 opaco al
    // cliente, por diseño. Los eventos del span son el único sitio donde queda
    // registrado CUÁL de los cuatro ocurrió, sin filtrarlo al atacante.
    //
    // Nunca se registran aquí ni la contraseña, ni el documento de identidad,
    // ni el correo: son datos personales o secretos. El `userId` solo se añade
    // cuando ya está autenticado.
    return this.tracing.runInSpan(
      'iam.authenticate',
      {
        [APP_ATTR.MODULE]: 'iam',
        [APP_ATTR.OPERATION]: 'authenticate',
        [APP_ATTR.ENTITY_TYPE]: 'iam.users',
        'iam.auth.subject_kind': dto.nationalId ? 'national_id' : 'email',
      },
      (span) => this.performLogin(dto, span, ip, userAgent, deviceCookie),
    );
  }

  /**
   * Autenticación propiamente dicha. La lógica no cambió al instrumentar; se
   * extrajo para que `login` sea solo la declaración del span de negocio.
   */
  private async performLogin(
    dto: LoginDto,
    span: TraceSpan,
    ip?: string,
    userAgent?: string,
    deviceCookie?: string,
  ): Promise<TokenResponseDto> {
    const subject = dto.nationalId ?? dto.email;
    if (!subject) {
      // El DTO ya lo exige, pero sin esta guarda un cuerpo inesperado buscaría
      // una credencial con subject `undefined` y devolvería la primera que
      // encontrara con ese valor nulo.
      span.addEvent('auth.rejected', { reason: 'no-subject' });
      await this.recordLoginFailure(undefined, ip, 'no-subject');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.logger.info(
      // El documento de identidad no se registra: es un dato personal y el
      // correo ya bastaba para diagnosticar un intento fallido.
      { operation: 'iam.auth.login', email: dto.email },
      'Login attempt',
    );
    const readEm = this.em.fork();

    const cred = await this.credentialsRepo.findActivePasswordByLoginIdentifier(
      readEm,
      subject,
    );
    if (!cred || !cred.secretHash) {
      span.addEvent('auth.rejected', { reason: 'no-credential' });
      await this.recordLoginFailure(undefined, ip, 'no-credential');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.usersRepo.findById(readEm, cred.userId);
    if (!user || user.statusConceptId !== CONCEPTS.USER_ACTIVE) {
      span.addEvent('auth.rejected', { reason: 'user-not-active' });
      await this.recordLoginFailure(user?.id, ip, 'user-not-active');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await argon2
      .verify(cred.secretHash, dto.password)
      .catch(() => false);
    if (!passwordOk) {
      span.addEvent('auth.rejected', { reason: 'bad-password' });
      await this.handleFailedPassword(user.id, ip);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const rules = await this.loadSessionRules(readEm, user.id);
    // Horario y red se evalúan organización por organización: una que niega no
    // le cierra el login a la persona en las demás.
    const denied = await this.tenantDenials(readEm, rules, { ip });
    await this.assertSomeTenantLeft(rules, denied, span, user.id, ip);
    // Segundo factor: lo exigen las organizaciones cuya política lo pide (y
    // que no negaron ya por otro motivo). Sin código, o sin factor dado de
    // alta, esas organizaciones salen del token en vez de tumbar el login.
    const mfaTenantIds = this.mfaTenantIds(rules, denied);
    const hasOtherTenant = this.tenantIdsOf(rules).some(
      (id) => !(id in denied) && !mfaTenantIds.includes(id),
    );
    const mfa = await this.assertMfaChallenge(
      readEm,
      user.id,
      dto.mfaCode,
      span,
      ip,
      mfaTenantIds.length > 0,
      hasOtherTenant,
    );
    if (mfa === 'missing') {
      for (const id of mfaTenantIds) denied[id] = 'MFA_REQUIRED';
    }
    const mfaEnrollmentRequired =
      mfaTenantIds.length > 0 &&
      mfa !== 'verified' &&
      mfa !== 'missing' &&
      (await this.mfaEnrollmentPending(readEm, user.id, true));
    if (mfaEnrollmentRequired) {
      for (const id of mfaTenantIds) denied[id] = 'MFA_ENROLLMENT_REQUIRED';
    }
    // Sin ninguna organización a la que entrar solo por falta del factor, el
    // token es de alcance limitado: sirve para dar de alta el factor y nada más.
    const limitedScope =
      mfaEnrollmentRequired &&
      this.tenantIdsOf(rules).every((id) => id in denied);
    // El dispositivo se reconoce ANTES de abrir la sesión: la sesión lo
    // referencia, y un fallo de esa contabilidad no puede tumbar el acceso.
    const recognition: DeviceRecognition =
      (await this.deviceRecognition?.recognize(
        user.id,
        userAgent,
        ip,
        rules,
        ...(deviceCookie !== undefined ? [deviceCookie] : []),
      )) ?? {};

    return this.em.transactional(async (tx) => {
      const withSupport = await this.loadAuthority(tx, user.id);
      const allTenants = withSupport.tenants;
      // Las organizaciones que niegan salen del token: sin ellas en `tenants`
      // el interceptor de tenant rechaza `X-Tenant-Id` con el motivo.
      const authority = withoutTenants(
        {
          roles: withSupport.roles,
          scopedRoles: withSupport.scopedRoles,
          tenants: allTenants,
        },
        Object.keys(denied),
      );
      const { tenantNames, tenantTypes, tenantAccountKinds } =
        await this.loadTenantDisplay(tx, authority.tenants);
      const issued = this.tokenService.issueSessionTokens(
        user.id,
        limitedScope ? [] : withPharmacyStaffRole(authority.roles, tenantTypes),
        limitedScope ? [] : authority.tenants,
        {
          name: user.displayName,
          tenantNames,
          tenantTypes,
          tenantAccountKinds,
          scopedRoles: limitedScope ? {} : authority.scopedRoles,
          deniedTenants: denied,
          mfaEnrollment: limitedScope,
          patientProfileId: limitedScope
            ? undefined
            : await this.loadPatientProfileId(tx, user.id),
          practitionerProfileId: limitedScope
            ? undefined
            : await this.loadPractitionerProfileId(tx, user.id),
          idleTimeoutMinutes: idleTimeoutClaim(rules, authority.tenants),
        },
        // La marca solo viaja cuando la sesión superó el segundo factor.
        ...(mfa === 'verified' ? [true] : []),
      );

      const session = this.sessionsRepo.create(tx, {
        userId: user.id,
        tokenId: issued.sessionTokenId,
        expiresAt: issued.expiresAt,
        deviceId: recognition.deviceId,
        ip,
      });
      // La sesión es el padre del refresh token: persistir antes de crearlo.
      await tx.flush();

      this.refreshRepo.create(tx, {
        sessionId: session.id,
        tokenHash: issued.refreshTokenHash,
        expiresAt: issued.expiresAt,
      });

      const managedUser = await this.usersRepo.findById(tx, user.id);
      if (managedUser) {
        managedUser.lastLoginAt = new Date();
        touch(managedUser, user.id);
      }

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        ip,
        detailJson:
          Object.keys(denied).length > 0
            ? { deniedTenants: Object.keys(denied).length }
            : undefined,
      });

      span.setAttribute(APP_ATTR.ENTITY_ID, user.id);
      span.addEvent('auth.session.issued');
      this.logger.info(
        { operation: 'iam.auth.login', userId: user.id },
        'Login succeeded',
      );
      return {
        accessToken: issued.accessToken,
        refreshToken: issued.refreshToken,
        expiresAt: issued.expiresAt,
        ...(recognition.notice ? { newDevice: recognition.notice } : {}),
        ...(recognition.deviceCookie
          ? { deviceCookie: recognition.deviceCookie }
          : {}),
        ...(mfaEnrollmentRequired ? { mfaEnrollmentRequired: true } : {}),
        ...(Object.keys(denied).length > 0
          ? { deniedTenants: toDeniedList(denied) }
          : {}),
      };
    });
  }

  /** Organizaciones activas de la persona según las reglas calculadas. */
  private tenantIdsOf(rules: EffectiveSessionRules | undefined): string[] {
    return [...(rules?.tenantIds ?? Object.keys(rules?.byTenant ?? {}))];
  }

  /**
   * Qué organizaciones niegan ahora por horario, inactividad o red. Cada una se
   * evalúa con SUS reglas.
   */
  private async tenantDenials(
    em: EntityManager,
    rules: EffectiveSessionRules | undefined,
    input: {
      readonly ip?: string;
      readonly lastActivityAt?: Date;
      readonly idleGraceMinutes?: number;
    },
  ): Promise<Record<string, TenantAccessDenial>> {
    if (!rules) return {};
    const denied: Record<string, TenantAccessDenial> = {
      ...violationsByTenant(
        rules,
        new Date(),
        input.lastActivityAt,
        input.idleGraceMinutes,
      ),
    } as Record<string, TenantAccessDenial>;
    const ipRules = this.ipRules;
    // Las reglas de red son de las organizaciones donde la persona es miembro
    // (`rules.ipRuleTenantIds`): lectura acotada con el contexto de sistema.
    const byNetwork = ipRules
      ? await withSystemRead(em, (db) =>
          ipRules.deniedTenantIds(db, rules, input.ip),
        )
      : [];
    for (const tenantId of byNetwork) {
      denied[tenantId] ??= 'OUTSIDE_ALLOWED_NETWORK';
    }
    return denied;
  }

  /**
   * Organizaciones que exigen el segundo factor y que no negaron ya por otro
   * motivo.
   */
  private mfaTenantIds(
    rules: EffectiveSessionRules | undefined,
    denied: Readonly<Record<string, TenantAccessDenial>>,
  ): string[] {
    return Object.entries(rules?.byTenant ?? {})
      .filter(([id, r]) => r.requireMfa && !(id in denied))
      .map(([id]) => id);
  }

  /**
   * Si NINGUNA organización deja entrar a la persona, el login se rechaza con 401
   * y el motivo de la primera: no hay otra organización a la que dejarla entrar
   * (quien solo pertenece a una, el caso de siempre). Si queda alguna, el login
   * sigue y las que niegan salen del token.
   *
   * Un rechazo por red deja un evento de seguridad (no cuenta como contraseña
   * fallida, así que no acerca la cuenta al bloqueo).
   */
  private async assertSomeTenantLeft(
    rules: EffectiveSessionRules | undefined,
    denied: Readonly<Record<string, TenantAccessDenial>>,
    span: TraceSpan,
    userId: string,
    ip: string | undefined,
  ): Promise<void> {
    if (!everyTenantDenied(this.tenantIdsOf(rules), denied)) return;
    const reasons = Object.values(denied);
    const violation = reasons.includes('OUTSIDE_ALLOWED_NETWORK')
      ? 'OUTSIDE_ALLOWED_NETWORK'
      : reasons[0];
    span.addEvent('auth.rejected', { reason: violation });
    if (violation !== 'OUTSIDE_ALLOWED_NETWORK') {
      throw new UnauthorizedException({
        message:
          'La política de sesión de su organización no permite entrar ahora',
        details: { reason: violation },
      });
    }
    await this.em.transactional(async (tx) => {
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId,
        ip,
        detailJson: { reason: violation },
      });
    });
    throw new UnauthorizedException({
      message:
        'La política de sesión de su organización solo permite entrar desde sus redes autorizadas',
      details: { reason: violation },
    });
  }

  /**
   * ¿Debe la persona dar de alta un segundo factor? Cuando una política lo exige
   * y no tiene ninguno confirmado, el login la deja entrar (el alta exige sesión)
   * con un token de alcance limitado y se lo avisa con `mfaEnrollmentRequired`.
   */
  private async mfaEnrollmentPending(
    em: EntityManager,
    userId: string,
    required: boolean,
  ): Promise<boolean> {
    if (!required || !this.mfaRepo) return false;
    const factors = (await this.mfaRepo.findVerifiedByUser(em, userId)).filter(
      (factor) => !!factor.secretEncrypted,
    );
    return factors.length === 0;
  }

  /**
   * Reglas de sesión efectivas del titular que se autentica; `undefined` si el
   * servicio de políticas no está o ninguna organización define una.
   */
  private async loadSessionRules(
    em: EntityManager,
    userId: string,
  ): Promise<EffectiveSessionRules | undefined> {
    const sessionPolicies = this.sessionPolicies;
    if (!sessionPolicies) return undefined;
    return withSystemRead(em, async (db) => {
      // Con los mismos roles que el token: el rol de apoyo nace del vínculo y sin
      // él las políticas del personal no alcanzarían a quien solo es apoyo.
      const { roles, scopedRoles, tenants } = await this.loadAuthority(
        db,
        userId,
      );
      return sessionPolicies.rulesFor(db, tenants, roles, scopedRoles);
    });
  }

  /**
   * Desafío MFA del login (TX-29), detrás de `AUTH_MFA_CHALLENGE_ENABLED`
   * (apagada por defecto: el cliente que no sabe pedir el código quedaría fuera)
   * o cuando una organización lo exige (`requiredByPolicy`).
   *
   * Sólo aplica a cuentas con un factor VERIFICADO. Sin `mfaCode` responde 401 con
   * `details.reason = MFA_REQUIRED` para que el cliente pida el código —salvo que
   * `canDegrade` diga que hay otras organizaciones a las que entrar: entonces
   * devuelve `'missing'` y quien llama quita de la sesión las que lo exigen—; con
   * un código que no valida o que ya se usó, 401 `MFA_INVALID` y cuenta para el
   * umbral de bloqueo, con un contador propio del segundo factor. Se corre
   * DESPUÉS de comprobar la contraseña: sin ella no se revela si la cuenta tiene
   * MFA.
   *
   * @param em - Contexto de lectura.
   * @param userId - Titular que se autentica.
   * @param mfaCode - Código TOTP presentado, si vino.
   * @param span - Span de autenticación.
   * @param ip - Origen de la petición.
   * @param requiredByPolicy - Una organización lo exige.
   * @param canDegrade - Hay otras organizaciones a las que entrar sin el factor.
   * @returns `'verified'` si un código valió; `'missing'` si faltó y se puede
   *   degradar; `undefined` si no aplica o no hay factor dado de alta.
   * @throws UnauthorizedException con `details.reason` si falta o no valida.
   */
  private async assertMfaChallenge(
    em: EntityManager,
    userId: string,
    mfaCode: string | undefined,
    span: TraceSpan,
    ip?: string,
    requiredByPolicy = false,
    canDegrade = false,
  ): Promise<'verified' | 'missing' | undefined> {
    if (
      (process.env.AUTH_MFA_CHALLENGE_ENABLED !== 'true' &&
        !requiredByPolicy) ||
      !this.mfaRepo
    ) {
      return undefined;
    }
    const factors = (await this.mfaRepo.findVerifiedByUser(em, userId)).filter(
      (factor) => !!factor.secretEncrypted,
    );
    if (factors.length === 0) {
      if (!requiredByPolicy) return undefined;
      // La política exige el código a quien ya tiene un factor. Quien no lo tiene
      // no queda bloqueado: el alta de un factor exige sesión, así que negarle el
      // login lo dejaría sin forma de enrolarlo. Queda la marca para el cliente.
      span.addEvent('auth.mfa-enrollment-pending', { userId });
      return undefined;
    }

    if (!mfaCode) {
      span.addEvent('auth.rejected', { reason: 'mfa-required' });
      if (canDegrade && process.env.AUTH_MFA_CHALLENGE_ENABLED !== 'true') {
        return 'missing';
      }
      throw new UnauthorizedException({
        message: 'Se requiere el código de verificación en dos pasos',
        details: { reason: 'MFA_REQUIRED' },
      });
    }
    const outcome = await this.totp?.consume(userId, factors, mfaCode);
    if (outcome?.valid) return 'verified';
    span.addEvent('auth.rejected', { reason: 'bad-mfa' });
    await this.handleFailedMfa(userId, ip);
    throw new UnauthorizedException({
      message: 'El código de verificación no es válido',
      details: { reason: 'MFA_INVALID' },
    });
  }

  /**
   * UC-01-06: rota el refresh token; detecta y castiga el reuso.
   *
   * Recibe el token en crudo y no el DTO porque desde que existe la entrega por
   * cookie httpOnly el token puede venir del cuerpo o de la cabecera `Cookie`:
   * de dónde se saca es asunto del transporte, y el dominio no tiene por qué
   * enterarse.
   *
   * @param refreshToken - Token en crudo presentado por el cliente.
   * @returns Par de tokens nuevo.
   * @throws UnauthorizedException si el token es inválido, reusado o expirado.
   */
  async refresh(refreshToken: string, ip?: string): Promise<TokenResponseDto> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);

    // Todo ocurre sobre la fila bloqueada dentro de una sola transacción
    // (MCH-005). Antes el estado se comprobaba en una lectura previa, fuera de
    // la transacción: dos peticiones con el mismo token la superaban y cada una
    // emitía un sucesor. Ahora la segunda espera el bloqueo, ve ROTATED y cae en
    // la política de reuso, igual que un token repetido más tarde.
    const outcome = await this.em.transactional(
      async (tx): Promise<RefreshOutcome> => {
        const rt = await this.refreshRepo.findByHashForUpdate(tx, tokenHash);
        if (!rt) return { kind: 'invalid' };

        if (rt.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
          // Reuso: un token ya rotado/revocado se presenta de nuevo → revocar
          // la sesión. Se devuelve en vez de lanzar para que la revocación se
          // confirme: una excepción acá desharía la transacción entera.
          this.logger.warn(
            {
              operation: 'iam.auth.refresh',
              sessionId: rt.sessionId,
              reason: 'token-reuse',
            },
            'Refresh token reuse detected',
          );
          this.eventsRepo.record(tx, {
            eventTypeConceptId: CONCEPTS.SEC_TOKEN_REUSE,
            outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
            userId: undefined,
            detailJson: { sessionId: rt.sessionId },
          });
          await this.refreshRepo.revokeBySessionId(tx, rt.sessionId);
          await this.sessionsRepo.revokeById(tx, rt.sessionId);
          return { kind: 'reuse' };
        }

        if (rt.expiresAt.getTime() < Date.now()) return { kind: 'expired' };

        const session = await this.sessionsRepo.findById(tx, rt.sessionId);
        if (!session || session.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
          throw new UnauthorizedException('Sesión no activa');
        }

        const withSupport = await this.loadAuthority(tx, session.userId);
        const allTenants = withSupport.tenants;
        // Políticas de sesión de las organizaciones del titular: horario permitido
        // e inactividad. La inactividad se mide desde el último refresco (la fila
        // del token vigente nació en él), así que su granularidad es la vida del
        // access token.
        const sessionPolicies = this.sessionPolicies;
        const rules = sessionPolicies
          ? await withSystemRead(tx, (db) =>
              sessionPolicies.rulesFor(
                db,
                allTenants,
                withSupport.roles,
                withSupport.scopedRoles,
              ),
            )
          : undefined;
        // El servidor no ve la actividad mientras el access token vive: el plazo
        // de inactividad que hace cumplir se mide con la vida del token de más.
        const denied = await this.tenantDenials(tx, rules, {
          ip,
          lastActivityAt: rt.createdAt,
          idleGraceMinutes: ttlToMinutes(this.authEnv.accessTtl),
        });
        // Solo se revoca la sesión si NINGUNA organización deja seguir a la
        // persona (quien pertenece a una sola, el caso de siempre): la política
        // de una organización no le cierra la sesión en las demás.
        if (everyTenantDenied(this.tenantIdsOf(rules), denied)) {
          const reasons = Object.values(denied);
          const violation = (
            reasons.includes('OUTSIDE_ALLOWED_NETWORK')
              ? 'OUTSIDE_ALLOWED_NETWORK'
              : reasons[0]
          ) as SessionPolicyViolation;
          await this.refreshRepo.revokeBySessionId(tx, rt.sessionId);
          await this.sessionsRepo.revokeById(tx, rt.sessionId);
          return { kind: 'policy', violation };
        }
        // Segundo factor: la sesión lo superó si lo presentó al entrar (marca del
        // refresh token) o si dio de alta y confirmó un factor DENTRO de ella.
        const mfaTenantIds = this.mfaTenantIds(rules, denied);
        let mfaVerified =
          this.tokenService.isMfaVerifiedRefreshToken(refreshToken);
        let enrollmentRequired = false;
        if (mfaTenantIds.length > 0 && !mfaVerified && this.mfaRepo) {
          const factors = (
            await this.mfaRepo.findVerifiedByUser(tx, session.userId)
          ).filter((factor) => !!factor.secretEncrypted);
          mfaVerified = factors.some(
            (factor) =>
              !!factor.verifiedAt && factor.verifiedAt > session.createdAt,
          );
          enrollmentRequired = factors.length === 0;
          if (!mfaVerified) {
            for (const id of mfaTenantIds) {
              denied[id] = enrollmentRequired
                ? 'MFA_ENROLLMENT_REQUIRED'
                : 'MFA_REQUIRED';
            }
          }
        }
        const limitedScope =
          enrollmentRequired &&
          this.tenantIdsOf(rules).every((id) => id in denied);
        const authority = withoutTenants(
          {
            roles: withSupport.roles,
            scopedRoles: withSupport.scopedRoles,
            tenants: allTenants,
          },
          Object.keys(denied),
        );
        // El refresco tiene que repoblar lo mismo que el login: si no, al rotar el
        // token la interfaz perdería el nombre y el tipo, y volvería a mostrar el
        // uuid o a ofrecerle a la aseguradora el menú de una cuenta cualquiera.
        const holder = await this.usersRepo.findById(tx, session.userId);
        const { tenantNames, tenantTypes, tenantAccountKinds } =
          await this.loadTenantDisplay(tx, authority.tenants);
        const accessToken = this.tokenService.signAccessToken(
          session.userId,
          session.tokenId,
          limitedScope
            ? []
            : withPharmacyStaffRole(authority.roles, tenantTypes),
          limitedScope ? [] : authority.tenants,
          {
            name: holder?.displayName,
            tenantNames,
            tenantTypes,
            tenantAccountKinds,
            scopedRoles: limitedScope ? {} : authority.scopedRoles,
            deniedTenants: denied,
            mfaEnrollment: limitedScope,
            patientProfileId: limitedScope
              ? undefined
              : await this.loadPatientProfileId(tx, session.userId),
            // También en el refresco: un claim que no sobrevive a la renovación
            // del token desaparece a los quince minutos, y la agenda del médico
            // se volvería la de otro sin que nadie tocara nada.
            practitionerProfileId: limitedScope
              ? undefined
              : await this.loadPractitionerProfileId(tx, session.userId),
            idleTimeoutMinutes: idleTimeoutClaim(rules, authority.tenants),
          },
        );
        const { raw, hash } = this.tokenService.issueRefreshToken(mfaVerified);
        const expiresAt = new Date(
          Date.now() + this.authEnv.refreshTtlDays * 24 * 60 * 60 * 1000,
        );

        rt.stateConceptId = CONCEPTS.STATE_ROTATED;
        touch(rt, session.userId);

        this.refreshRepo.create(tx, {
          sessionId: session.id,
          tokenHash: hash,
          expiresAt,
          replacedById: rt.id,
        });

        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_TOKEN_REFRESH,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId: session.userId,
        });

        return {
          kind: 'rotated',
          tokens: {
            accessToken,
            refreshToken: raw,
            expiresAt,
            ...(enrollmentRequired && !mfaVerified
              ? { mfaEnrollmentRequired: true }
              : {}),
            ...(Object.keys(denied).length > 0
              ? { deniedTenants: toDeniedList(denied) }
              : {}),
          },
        };
      },
    );

    switch (outcome.kind) {
      case 'rotated':
        return outcome.tokens;
      case 'reuse':
        throw new UnauthorizedException('Reuso de refresh token detectado');
      case 'expired':
        throw new UnauthorizedException('Refresh token expirado');
      case 'policy':
        throw new UnauthorizedException({
          message: 'La política de sesión de la organización cerró la sesión',
          details: { reason: outcome.violation },
        });
      default:
        throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /** UC-01-08: revoca todas las sesiones activas del usuario actual. */
  async logoutAll(actor: AuthenticatedUser): Promise<LogoutAllResultDto> {
    this.logger.info(
      { operation: 'iam.auth.logout-all', userId: actor.id },
      'Global logout',
    );
    return this.em.transactional(async (tx) => {
      const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
        tx,
        actor.id,
      );
      const revokedSessions = await this.sessionsRepo.revokeAllActiveForUser(
        tx,
        actor.id,
      );
      await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
      });

      return { revokedSessions };
    });
  }

  /**
   * Cierra **la sesión del token en uso**, no todas.
   *
   * Existía `logout-all` y no esto, así que cerrar sesión sólo borraba el estado
   * del navegador: el refresh token seguía sirviendo hasta caducar —30 días— aun
   * después de que la persona creyera haber salido. Un token robado sobrevivía
   * al gesto que justamente busca cortarlo.
   *
   * Es idempotente: si la sesión ya no estaba activa devuelve `revoked: false`
   * en vez de fallar. Cerrar algo ya cerrado no es un error.
   *
   * @param actor - Sujeto autenticado; su `sessionId` es el `sid` del token.
   * @returns Si la sesión quedó revocada en esta llamada.
   */
  async logout(actor: AuthenticatedUser): Promise<LogoutResultDto> {
    this.logger.info(
      { operation: 'iam.auth.logout', userId: actor.id },
      'Session logout',
    );
    // Un token sin `sid` no ancla ninguna sesión que revocar: es el caso de los
    // tokens de sistema que firman los workers.
    if (!actor.sessionId) return { revoked: false };

    // El paso extra no sobrevive a la sesión (best-effort: no lanza).
    await this.stepUp?.clear(actor.sessionId);

    return this.em.transactional(async (tx) => {
      const session = await this.sessionsRepo.findActiveByTokenId(
        tx,
        actor.sessionId as string,
      );
      // La sesión es de quien la cierra: sin esta comprobación, un token válido
      // podría cerrar la sesión de otro usuario nombrando su `sid`.
      if (!session || session.userId !== actor.id) return { revoked: false };

      await this.sessionsRepo.revokeById(tx, session.id);
      // El refresh token es lo que de verdad sobrevive: revocar la sesión sin
      // revocarlo dejaría viva la llave que renueva el acceso.
      await this.refreshRepo.revokeBySessionId(tx, session.id);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        detailJson: { scope: 'single-session' },
      });

      return { revoked: true };
    });
  }

  /** UC-01-11: expira sesiones y refresh tokens ya vencidos. */
  async purgeSessions(actor: AuthenticatedUser): Promise<PurgeResultDto> {
    this.logger.info(
      { operation: 'iam.auth.purge', actorId: actor.id },
      'Purging expired sessions',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const expiredSessions = await this.sessionsRepo.purgeExpired(tx, now);
      const expiredTokens = await this.refreshRepo.purgeExpired(tx, now);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_SESSION_PURGE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
        detailJson: { expiredSessions, expiredTokens },
      });

      return { expiredSessions, expiredTokens };
    });
  }

  /** Registra un login fallido en su propia transacción (se confirma pese al throw). */
  private async recordLoginFailure(
    userId: string | undefined,
    ip: string | undefined,
    reason: string,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId,
        ip,
        detailJson: { reason },
      });
    });
    this.logger.warn({ operation: 'iam.auth.login', reason }, 'Login failed');
  }

  /**
   * Contraseña incorrecta: registra el fallo y, si se alcanza el umbral, crea el
   * bloqueo de cuenta y revoca sesiones (realiza UC-01-07 de forma automática).
   */
  private async handleFailedPassword(
    userId: string,
    ip: string | undefined,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId,
        ip,
        detailJson: { reason: 'bad-password' },
      });
      // Persistir el evento antes de contar para que el conteo lo incluya.
      await tx.flush();

      const user = await this.usersRepo.findById(tx, userId);
      const failedCount = await this.eventsRepo.countFailedLoginsSince(
        tx,
        userId,
        user?.lastLoginAt,
      );

      if (failedCount >= this.authEnv.lockThreshold) {
        await this.lockAccount(tx, userId, ip, failedCount, 'password');
      }
    });
  }

  /**
   * Código de segundo factor incorrecto (o ya usado): registra el fallo y cuenta
   * con un contador PROPIO del segundo factor, aparte del de contraseña. Quien
   * ya sabe la contraseña no puede adivinar los códigos sin que la cuenta se
   * bloquee al llegar al mismo umbral que las contraseñas.
   */
  private async handleFailedMfa(
    userId: string,
    ip: string | undefined,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId,
        ip,
        detailJson: { reason: 'bad-mfa' },
      });
      await tx.flush();

      const user = await this.usersRepo.findById(tx, userId);
      const failedCount = await this.eventsRepo.countFailedMfaSince(
        tx,
        userId,
        user?.lastLoginAt,
      );
      this.logger.warn(
        { operation: 'iam.auth.login', reason: 'bad-mfa', failedCount },
        'Login failed',
      );
      if (failedCount >= this.authEnv.lockThreshold) {
        await this.lockAccount(tx, userId, ip, failedCount, 'mfa');
      }
    });
  }

  /** Bloquea la cuenta por intentos fallidos y cierra todas sus sesiones. */
  private async lockAccount(
    tx: EntityManager,
    userId: string,
    ip: string | undefined,
    failedCount: number,
    source: 'password' | 'mfa',
  ): Promise<void> {
    this.logger.warn(
      {
        operation: 'iam.auth.login',
        userId,
        failedCount,
        reason: 'lock-threshold',
        source,
      },
      'Account locked after repeated failures',
    );
    const user = await this.usersRepo.findById(tx, userId);
    if (user) {
      user.statusConceptId = CONCEPTS.USER_LOCKED;
      touch(user, userId);
    }

    // Fila sin organización: con RLS solo se escribe con el contexto de sistema
    // acotado que abre el repositorio, y solo para esta cuenta.
    await this.lockoutsRepo.lockForFailedAttempts(tx, {
      userId,
      reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
      failedAttempts: failedCount,
      sourceIp: ip,
    });

    const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
      tx,
      userId,
    );
    await this.sessionsRepo.revokeAllActiveForUser(tx, userId);
    await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);

    this.eventsRepo.record(tx, {
      eventTypeConceptId: CONCEPTS.SEC_ACCOUNT_LOCK,
      outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
      userId,
      ip,
      detailJson: { failedAttempts: failedCount, source: 'auto', by: source },
    });
  }
}
