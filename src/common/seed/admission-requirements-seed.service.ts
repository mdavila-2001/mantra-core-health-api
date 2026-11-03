import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { AdmissionRequirementsRepository } from '../../modules/profiles/infrastructure/repositories';
import {
  ADMISSION_ITEM_CONCEPT,
  PRACTITIONER_ONBOARDING_REQUIREMENTS,
} from '../../modules/profiles/domain/admissions/admission-requirements.catalog';

/** Resultado de la siembra. */
export interface AdmissionRequirementsSeedResult {
  /** Requisitos creados en esta pasada. */
  readonly created: number;
}

/**
 * Siembra el catálogo de requisitos de la admisión ALTA_DE_DOCTOR (proceso 2.1
 * del registro de procesos del stakeholder).
 *
 * ## Idempotente y sin editar en sitio
 *
 * Crea lo que falta y **no toca** lo que ya existe: la semántica de un
 * requisito no se cambia en una fila viva porque alteraría revisiones en vuelo.
 * Cambiar un requisito es desactivarlo (`is_active = false`) y crear otro con
 * otro código.
 *
 * Corre **después** del catálogo de conceptos: el tipo de admisión, la clase de
 * ficha, el tipo de evidencia y el método son conceptos `profiles:ADMISSION_*`
 * que aquél materializa. Los ids son deterministas (uuid5 del tipo y el
 * código), así que dos instancias arrancando a la vez no se duplican.
 */
@Injectable()
export class AdmissionRequirementsSeedService {
  private readonly repo = new AdmissionRequirementsRepository();

  /**
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdmissionRequirementsSeedService.name);
  }

  /** Ejecuta la siembra. Público para `yarn seed:boot` y el arnés de integración. */
  async run(): Promise<AdmissionRequirementsSeedResult> {
    const em = this.orm.em.fork();
    const created = await em.transactional(async (tx) =>
      this.repo.seedMissing(
        tx,
        PROF.ADMISSION_TYPE_PRACTITIONER_ONBOARDING,
        'practitioner-onboarding',
        PRACTITIONER_ONBOARDING_REQUIREMENTS,
        ADMISSION_ITEM_CONCEPT,
      ),
    );
    this.logger.info(
      { operation: 'seed.admission-requirements', created },
      'Admission requirements seeded',
    );
    return { created };
  }
}
