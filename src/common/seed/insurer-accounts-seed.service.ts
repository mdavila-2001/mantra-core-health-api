import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { AuthenticationCredentials } from '../../modules/iam/entities';
import { TenantMemberships } from '../../modules/directory/entities';
import { DIR } from '../../modules/directory/directory.concepts';
import { InsuranceCarriers } from '../../modules/insurance/entities';
import { IamUsersService } from '../../modules/iam/application/services';
import { deterministicId } from '../constants/concepts';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';
import { createdBy } from '../persistence/audit-fields';
import {
  INSURER_ACCOUNTS,
  type InsurerAccountSeed,
} from './insurer-accounts.catalog';

/** Lo que el seed dejó hecho. */
export interface InsurerAccountsResult {
  /** Cuentas creadas en esta pasada; 0 si ya estaban todas. */
  created: number;
  /** Motivo por el que no se hizo nada, si se saltó. */
  skipped?: 'not-configured' | 'production-not-allowed';
}

/**
 * Siembra las cuentas de operador de las aseguradoras (`acceso@<dominio>`).
 *
 * Reemplaza al parche SQL que las creaba con una clave fija en todos los
 * entornos. Tiene el mismo candado que {@link ProviderAccountsSeedService}:
 * sin `SEED_DEMO_PASSWORD` no hace nada y con `NODE_ENV=production` se niega
 * salvo `SEED_DEMO_ALLOW_PRODUCTION=true`.
 *
 * Reutiliza `IamUsersService.createUser` (el hash argon2id vive en un solo
 * sitio) y converge: una cuenta cuyo correo ya tiene credencial se deja tal
 * cual, **sin tocar su clave**. Una aseguradora que todavía no está sembrada
 * se omite, para no dejar usuarios sin organización.
 */
@Injectable()
export class InsurerAccountsSeedService {
  /**
   * @param orm - Acceso al `EntityManager` de la aplicación.
   * @param users - Alta de usuarios, que es quien sabe hashear la contraseña.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly users: IamUsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InsurerAccountsSeedService.name);
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
  ): Promise<InsurerAccountsResult> {
    if (!password) return { created: 0, skipped: 'not-configured' };

    if (nodeEnv === 'production' && !allowProduction) {
      this.logger.warn(
        { operation: 'seed.insurer-accounts' },
        'Cuentas de aseguradoras omitidas en producción: hace falta SEED_DEMO_ALLOW_PRODUCTION=true',
      );
      return { created: 0, skipped: 'production-not-allowed' };
    }

    const em = this.orm.em.fork();
    // Toda cuenta y membresía que siembra cita al actor por `created_by_user_id`
    // (FK a `iam.users`): en una base nueva tiene que existir antes (api#1230).
    await ensureSeedActor(em);
    let created = 0;
    for (const account of INSURER_ACCOUNTS) {
      if (await this.ensureAccount(em, account, password)) created += 1;
    }
    await em.flush();

    if (created > 0) {
      this.logger.info(
        { operation: 'seed.insurer-accounts', created },
        'Cuentas de demostración de aseguradoras disponibles',
      );
    }
    return { created };
  }

  /**
   * Crea la cuenta si su correo no tiene credencial y la hace administradora
   * del tenant de su aseguradora.
   *
   * @returns `true` si esta pasada la creó.
   */
  private async ensureAccount(
    em: EntityManager,
    account: InsurerAccountSeed,
    password: string,
  ): Promise<boolean> {
    const existing = await em.findOne(AuthenticationCredentials, {
      externalSubject: account.email,
    });
    if (existing) return false;

    const carrier = await em.findOne(InsuranceCarriers, {
      carrierCode: account.carrierCode,
    });
    if (!carrier) {
      this.logger.warn(
        {
          operation: 'seed.insurer-accounts',
          carrierCode: account.carrierCode,
        },
        'Aseguradora no sembrada: la cuenta se omite',
      );
      return false;
    }

    const user = await this.users.createUser(
      {
        displayName: account.displayName,
        email: account.email,
        password,
        timeZone: 'America/La_Paz',
        initialRole: 'USER',
      },
      { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] },
    );

    em.create(
      TenantMemberships,
      {
        id: deterministicId(`seed:insurer-membership:${account.email}`),
        userId: user.id,
        tenantId: carrier.tenantId,
        tenantRoleConceptId: DIR.ROLE_ADMIN,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(SEED_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
    return true;
  }
}
