import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { AuthenticationCredentials } from '../../modules/iam/entities';
import { Roles, UserRoleAssignments } from '../../modules/authz/entities';
import { TenantMemberships } from '../../modules/directory/entities';
import { DIR } from '../../modules/directory/directory.concepts';
import { IamUsersService } from '../../modules/iam/services';
import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';
import {
  PROVIDER_ACCOUNTS,
  type ProviderAccountSeed,
} from './provider-accounts.catalog';

/**
 * Actor determinista al que apuntan los `created_by_user_id` de estas altas.
 *
 * Es el mismo mecanismo que usa el administrador de arranque: el alta escribe
 * `created_by_user_id = actor.id`, que es FK a `iam.users`, así que quien crea
 * tiene que existir antes. Se reutiliza el actor de arranque en vez de inventar
 * otro: es el mismo hecho —«esto lo sembró la plataforma»— y dos actores para
 * lo mismo obligarían a explicar la diferencia.
 */
const SEED_ACTOR_ID = deterministicId('seed:user:bootstrap-actor');

/** Lo que el seed dejó hecho. */
export interface ProviderAccountsResult {
  /** Cuentas creadas en esta pasada; 0 si ya estaban todas. */
  created: number;
  /** Motivo por el que no se hizo nada, si se saltó. */
  skipped?: 'not-configured' | 'production-not-allowed';
}

/**
 * Siembra una cuenta de demostración por cada socio comercial.
 *
 * ## Qué problema resuelve
 *
 * El paquete de seeds del modelo siembra las **organizaciones** —16 farmacias
 * con sus sedes y productos, 6 unidades de diagnóstico, 12 aseguradoras con sus
 * planes—, y también sus operadores: 14 perfiles de proveedor y 17
 * representantes de aseguradora, todos con su fila en `person_account_links`.
 *
 * Pero **nadie podía entrar como ninguno de ellos**. La credencial de esas
 * cuentas quedó con el relleno del generador —`IAM-AUTHENTICATI-000003`,
 * `IAM-AUTHENTICATI-000004 (caso 11)`—, que no es un identificador que se pueda
 * tipear y cuya contraseña nadie conoce. Las organizaciones existían para
 * *buscarlas en el directorio*, no para *operar con ellas*.
 *
 * Este seed cierra ese hueco con cuatro cuentas de verdad, una por módulo del
 * registro de procesos: farmacia, laboratorio de sangre, análisis por imagen y
 * aseguradora.
 *
 * ## Tres decisiones que no se leen en el código
 *
 * - **Reutiliza `IamUsersService.createUser`** en vez de escribir la credencial
 *   a mano, por lo mismo que el administrador de arranque: el hash argon2id y
 *   sus parámetros viven en un solo sitio.
 * - **Es opt-in por entorno.** Sin `SEED_DEMO_PASSWORD` no hace absolutamente
 *   nada, así que arrancar la API no crea cuentas por sorpresa. Se comparte la
 *   contraseña entre las cuatro a propósito: son de demostración y recordar
 *   cuatro claves distintas para enseñar el producto no aporta seguridad, sólo
 *   fricción.
 * - **Se niega en producción** salvo permiso explícito, igual que el arranque.
 *   Cuatro cuentas con contraseña conocida son aceptables para levantar un
 *   entorno local o una demo; en producción tienen que ser una decisión
 *   consciente y no el default de un compose copiado.
 *
 * Converge en vez de abortar: cada cuenta comprueba si ya existe, así que
 * reejecutarlo sobre una base a medias completa lo que falte.
 */
@Injectable()
export class ProviderAccountsSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` de la aplicación.
   * @param users - Alta de usuarios, que es quien sabe hashear la contraseña.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly users: IamUsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProviderAccountsSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @param password - Contraseña compartida; sin ella no hace nada.
   * @param nodeEnv - Entorno, para negarse en producción.
   * @param allowProduction - Permiso explícito para sembrar en producción.
   * @returns Cuántas cuentas se crearon.
   */
  async run(
    password = process.env.SEED_DEMO_PASSWORD,
    nodeEnv = process.env.NODE_ENV,
    allowProduction = process.env.SEED_DEMO_ALLOW_PRODUCTION === 'true',
  ): Promise<ProviderAccountsResult> {
    if (!password) return { created: 0, skipped: 'not-configured' };

    if (nodeEnv === 'production' && !allowProduction) {
      this.logger.warn(
        { operation: 'seed.provider-accounts' },
        'Cuentas de demostración omitidas en producción: hace falta SEED_DEMO_ALLOW_PRODUCTION=true',
      );
      return { created: 0, skipped: 'production-not-allowed' };
    }

    const em = this.orm.em.fork();
    let created = 0;
    for (const cuenta of PROVIDER_ACCOUNTS) {
      if (await this.ensureAccount(em, cuenta, password)) created += 1;
    }
    await em.flush();

    if (created > 0) {
      this.logger.info(
        { operation: 'seed.provider-accounts', created },
        'Cuentas de demostración de proveedores disponibles',
      );
    }
    return { created };
  }

  /**
   * Crea una cuenta si todavía no existe, y la hace miembro del tenant semilla.
   *
   * @param em - Contexto de persistencia.
   * @param cuenta - La cuenta declarada en el catálogo.
   * @param password - Contraseña compartida.
   * @returns `true` si esta pasada la creó.
   */
  private async ensureAccount(
    em: EntityManager,
    cuenta: ProviderAccountSeed,
    password: string,
  ): Promise<boolean> {
    const existente = await em.findOne(AuthenticationCredentials, {
      externalSubject: cuenta.email,
    });
    if (existente) {
      await this.ensureMembership(em, existente.userId);
      return false;
    }

    const creado = await this.users.createUser(
      {
        displayName: cuenta.displayName,
        email: cuenta.email,
        password,
        // `initialRole` solo admite USER o SECURITY_ADMIN: es el rol GLOBAL de
        // la plataforma. El de dominio —farmacia, laboratorio…— vive en
        // `authz.roles` y se asigna aparte, acotado al tenant.
        initialRole: 'USER',
      },
      { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] },
    );

    // Sin membresía en un tenant, la sesión entra pero no tiene organización
    // activa: toda pantalla que dependa de `tenantId` queda bloqueada pidiendo
    // que se elija una que la cuenta no tiene.
    await this.ensureMembership(em, creado.id);
    await this.ensureRole(em, creado.id, cuenta.initialRole);

    this.logger.info(
      {
        operation: 'seed.provider-accounts',
        organizacion: cuenta.organizacion,
        role: cuenta.initialRole,
      },
      'Cuenta de demostración creada',
    );
    return true;
  }

  /** Hace a la cuenta miembro del tenant semilla, si no lo era ya. */
  private async ensureMembership(
    em: EntityManager,
    userId: string,
  ): Promise<void> {
    const existente = await em.findOne(TenantMemberships, {
      userId,
      tenantId: SEED.tenantId,
    });
    if (existente) return;

    em.create(
      TenantMemberships,
      {
        userId,
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(SEED_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
  }

  /**
   * Le da el rol de dominio, acotado al tenant semilla.
   *
   * Es lo que decide qué ve la cuenta al entrar. Si el rol no existe en
   * `authz.roles` se omite con un aviso en vez de fallar: la cuenta igual sirve
   * para iniciar sesión, y un seed de demostración no debería tumbar el
   * arranque de la API por un rol que el catálogo todavía no declara.
   */
  private async ensureRole(
    em: EntityManager,
    userId: string,
    code: string,
  ): Promise<void> {
    const rol = await em.findOne(Roles, { code });
    if (!rol) {
      this.logger.warn(
        { operation: 'seed.provider-accounts', role: code },
        'Rol no declarado en authz.roles: la cuenta queda sin él',
      );
      return;
    }

    const existente = await em.findOne(UserRoleAssignments, {
      userId,
      roleId: rol.id,
      tenantId: SEED.tenantId,
    });
    if (existente) return;

    em.create(
      UserRoleAssignments,
      {
        userId,
        roleId: rol.id,
        tenantId: SEED.tenantId,
        assignedByUserId: SEED_ACTOR_ID,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: new Date(),
        ...createdBy(SEED_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
  }
}
