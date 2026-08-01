import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthenticationCredentials,
  UserGlobalRoles,
  Users,
} from '../../modules/iam/entities';
import { TenantMemberships } from '../../modules/directory/entities';
import { DIR } from '../../modules/directory/directory.concepts';
import { IamUsersService } from '../../modules/iam/services';
import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';

/**
 * Actor determinista al que apuntan las columnas `created_by_user_id` del alta.
 *
 * El alta escribe `created_by_user_id = actor.id`, que es FK a `iam.users`: el
 * actor tiene que existir **antes** que el administrador que crea. Se
 * autorreferencia, igual que el admin del harness de integración.
 */
const BOOTSTRAP_ACTOR_ID = deterministicId('seed:user:bootstrap-actor');

/** Configuración de arranque leída del entorno. */
export interface BootstrapAdminEnv {
  /** Email del primer administrador; sin él el seed no hace nada. */
  email?: string;
  /** Contraseña en claro, que se hashea con argon2id al crear la credencial. */
  password?: string;
  /** Permiso explícito para sembrar en `NODE_ENV=production`. */
  allowProduction: boolean;
  /** Entorno declarado, para decidir si hace falta ese permiso. */
  nodeEnv?: string;
}

/**
 * Lee la configuración del seed de arranque.
 *
 * @param source - Origen de variables; `process.env` salvo en pruebas.
 * @returns Configuración normalizada.
 */
export function loadBootstrapAdminEnv(
  source: NodeJS.ProcessEnv = process.env,
): BootstrapAdminEnv {
  return {
    email: source.BOOTSTRAP_ADMIN_EMAIL || undefined,
    password: source.BOOTSTRAP_ADMIN_PASSWORD || undefined,
    allowProduction: source.BOOTSTRAP_ADMIN_ALLOW_PRODUCTION === 'true',
    nodeEnv: source.NODE_ENV,
  };
}

/** Por qué una pasada del seed no llegó a crear nada. */
export type BootstrapAdminSkipReason =
  'not-configured' | 'incomplete-config' | 'production-not-allowed';

/** Qué hizo una pasada del seed. */
export interface BootstrapAdminResult {
  /** `true` si el administrador quedó utilizable al terminar. */
  provisioned: boolean;
  /** Id del administrador, si el seed llegó a resolverlo. */
  userId?: string;
  /** Motivo por el que no se hizo nada, si se saltó. */
  skipped?: BootstrapAdminSkipReason;
}

/**
 * Siembra el primer `SECURITY_ADMIN` con contraseña (tarjeta 5).
 *
 * Existe porque `POST /iam/users` exige rol `SECURITY_ADMIN`: recién instalada,
 * la plataforma no tiene ninguno, así que sólo se pueden ejercer los endpoints
 * públicos y **no hay forma de crear el primero por API**. Es el clásico arranque
 * en frío de un sistema cerrado.
 *
 * Tres decisiones que no se leen en el código:
 *
 * - **Reutiliza `IamUsersService.createUser`** en vez de escribir la credencial a
 *   mano. El hash argon2id y sus parámetros viven en un solo sitio; duplicarlos
 *   aquí crearía dos fuentes de verdad que se separarían en cuanto una cambiara.
 * - **Es opt-in por entorno.** Sin `BOOTSTRAP_ADMIN_EMAIL` y
 *   `BOOTSTRAP_ADMIN_PASSWORD` no hace absolutamente nada, así que arrancar la
 *   API no crea cuentas por sorpresa.
 * - **Se niega en producción** salvo `BOOTSTRAP_ADMIN_ALLOW_PRODUCTION=true`. Una
 *   contraseña que viaja en una variable de entorno y queda en el historial del
 *   despliegue es aceptable para levantar un entorno local; en producción tiene
 *   que ser una decisión consciente y no el default de un compose copiado.
 *
 * Converge en vez de abortar: cada paso comprueba si ya está hecho, así que
 * reejecutarlo sobre una base a medias completa lo que falte.
 */
@Injectable()
export class BootstrapAdminSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` para las filas que no pasan por IAM.
   * @param users - Servicio de alta que hashea la credencial como lo haría la API.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly users: IamUsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BootstrapAdminSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración y el script de
   * Postman lo invoquen tras materializar el esquema.
   *
   * @param env - Configuración; por defecto, la del proceso.
   * @returns Qué hizo la pasada.
   */
  async run(
    env: BootstrapAdminEnv = loadBootstrapAdminEnv(),
  ): Promise<BootstrapAdminResult> {
    const gate = this.checkGate(env);
    if (gate) return { provisioned: false, skipped: gate };

    const em = this.orm.em.fork();
    await this.ensureActor(em);

    const userId = await this.ensureAdmin(
      em,
      env.email as string,
      env.password as string,
    );
    await this.ensureSuperadminRole(em, userId);
    await this.ensureDefaultMembership(em, userId);

    this.logger.info(
      { operation: 'seed.bootstrap-admin', userId, tenantId: SEED.tenantId },
      'Administrador de arranque disponible',
    );
    return { provisioned: true, userId };
  }

  /**
   * Decide si el seed puede correr en este entorno.
   *
   * @param env - Configuración leída.
   * @returns El motivo del salto, o `undefined` si puede seguir.
   */
  private checkGate(
    env: BootstrapAdminEnv,
  ): BootstrapAdminSkipReason | undefined {
    if (!env.email && !env.password) return 'not-configured';

    // Media configuración es casi siempre una variable mal escrita. Saltar en
    // silencio dejaría a quien despliega esperando un administrador que nunca
    // llega, sin nada en el log que lo explique.
    if (!env.email || !env.password) {
      this.logger.warn(
        { operation: 'seed.bootstrap-admin' },
        'Seed de administrador omitido: hacen falta BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD, no una sola',
      );
      return 'incomplete-config';
    }

    if (env.nodeEnv === 'production' && !env.allowProduction) {
      this.logger.warn(
        { operation: 'seed.bootstrap-admin' },
        'Seed de administrador omitido en producción: exige BOOTSTRAP_ADMIN_ALLOW_PRODUCTION=true explícito',
      );
      return 'production-not-allowed';
    }

    return undefined;
  }

  /** Materializa el actor autorreferenciado que firma el alta del administrador. */
  private async ensureActor(em: EntityManager): Promise<void> {
    if (await em.findOne(Users, { id: BOOTSTRAP_ACTOR_ID })) return;

    em.create(
      Users,
      {
        id: BOOTSTRAP_ACTOR_ID,
        displayName: 'Bootstrap',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        emailVerified: true,
        phoneVerified: false,
        ...createdBy(BOOTSTRAP_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
  }

  /**
   * Crea el administrador, o resuelve el que ya existe.
   *
   * El 409 de email duplicado no es un fallo aquí: significa que una pasada
   * anterior ya lo creó. Se reutiliza esa cuenta para poder completar los pasos
   * que hayan quedado a medias.
   */
  private async ensureAdmin(
    em: EntityManager,
    email: string,
    password: string,
  ): Promise<string> {
    try {
      const created = await this.users.createUser(
        {
          displayName: 'Administrador de arranque',
          email,
          password,
          initialRole: 'SECURITY_ADMIN',
        },
        { id: BOOTSTRAP_ACTOR_ID, roles: ['SECURITY_ADMIN'] },
      );
      return created.id;
    } catch (error) {
      if ((error as { status?: number })?.status !== 409) throw error;

      const credential = await em.findOne(AuthenticationCredentials, {
        externalSubject: email,
      });
      if (!credential?.userId) throw error;
      return credential.userId;
    }
  }

  /**
   * Concede el rol global `SUPERADMIN`.
   *
   * El JWT sólo lo lleva si existe la fila, y es el único rol que puede declarar
   * `X-Tenant-Id` de cualquier tenant (`PRIVILEGED_TENANT_ROLES` en
   * `tenant-context.interceptor`). Sin él, el administrador queda encerrado en su
   * propio tenant.
   */
  private async ensureSuperadminRole(
    em: EntityManager,
    userId: string,
  ): Promise<void> {
    const existing = await em.findOne(UserGlobalRoles, {
      userId,
      roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
    });
    if (existing) return;

    em.create(
      UserGlobalRoles,
      {
        userId,
        roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(BOOTSTRAP_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
  }

  /**
   * Da de alta la membresía en el tenant sembrado.
   *
   * Sin ella el token viaja sin `tenants` y el interceptor responde 403 («el
   * actor no pertenece a ningún tenant») aunque el login sí devuelva token — un
   * fallo que se lee como un problema de credenciales y no lo es.
   */
  private async ensureDefaultMembership(
    em: EntityManager,
    userId: string,
  ): Promise<void> {
    const existing = await em.findOne(TenantMemberships, {
      userId,
      tenantId: SEED.tenantId,
    });
    if (existing) return;

    em.create(
      TenantMemberships,
      {
        userId,
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(BOOTSTRAP_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
  }
}
