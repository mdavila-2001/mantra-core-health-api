import { BadRequestException, Logger } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import {
  declaredPlanSector,
  type InsuranceSector,
} from '../../../common/seed/bolivia-insurance.catalog';
import { INS } from '../insurance.concepts';
import type { CatalogRepository, CoverageRepository } from '../repositories';

/** Lo que hace falta para anotar el seguro que el paciente declara al registrarse. */
export interface DeclaredCoverageData {
  /** Perfil del paciente que declara la cobertura. */
  readonly patientProfileId: string;
  /** Plan elegido en el alta. */
  readonly insurancePlanId: string;
  /** Sector que le corresponde a ese plan según dónde se lo eligió. */
  readonly expectedSector: InsuranceSector;
  /**
   * Orden de la cobertura: 1 para la privada, 2 para la pública.
   *
   * Una persona puede tener las dos —afiliada a la Caja y con póliza privada—;
   * el orden dice a cuál se recurre primero.
   */
  readonly coverageOrder: number;
  /** Documento del titular, que se anota como número de afiliado provisional. */
  readonly memberIdentifier: string;
  /** Quién escribe la fila, para la auditoría. */
  readonly actorUserId: string;
}

const logger = new Logger('DeclaredCoverage');

/**
 * Anota la cobertura que el paciente **declara** tener al registrarse.
 *
 * ## Qué es y qué no es esta fila
 *
 * Es lo que la persona dice, no lo que la aseguradora confirma. Por eso nace
 * con `VERIFY_PENDING`: quien la lea sabe que nadie la validó todavía. Y por eso
 * `member_identifier` lleva el documento de identidad y no el número de
 * afiliado —que el paciente rara vez recuerda al registrarse—: es un marcador
 * honesto y buscable hasta que alguien lo corrija con el número real.
 *
 * ## Por qué viaja el plan y no la aseguradora
 *
 * Porque `insurance.patient_coverages` apunta a `insurance_plan_id`. Varias
 * compañías publican más de un plan, y elegir por la persona cuál de los tres
 * planes de una aseguradora tiene sería inventar el dato. Para las compañías de
 * plan único, elegir la compañía en la pantalla ya elige su plan.
 *
 * @param repos - Repositorios de catálogo y de coberturas.
 * @param tx - Contexto transaccional del alta.
 * @param data - Perfil, plan, sector esperado, orden, documento y actor.
 * @returns `true` si escribió la cobertura; `false` si ya existía.
 * @throws BadRequestException si el plan no es del catálogo, si es de otro
 *   sector que aquel donde se lo eligió, o si está dado de baja.
 */
export async function createDeclaredCoverage(
  repos: {
    readonly catalog: CatalogRepository;
    readonly coverage: CoverageRepository;
  },
  tx: EntityManager,
  data: DeclaredCoverageData,
): Promise<boolean> {
  const sector = declaredPlanSector(data.insurancePlanId);
  if (!sector) {
    throw new BadRequestException(
      'El seguro indicado no pertenece al catálogo de aseguradoras de Bolivia',
    );
  }
  if (sector !== data.expectedSector) {
    // Un seguro público elegido en el campo del privado (o al revés) no es un
    // descuido inofensivo: los dos conviven en la misma alta y aceptarlo
    // dejaría dos filas del mismo sector con órdenes que no significan nada.
    throw new BadRequestException(
      data.expectedSector === 'private'
        ? 'El seguro indicado como privado es un seguro público'
        : 'El seguro indicado como público es un seguro privado',
    );
  }

  const plan = await repos.catalog.findPlan(tx, data.insurancePlanId);
  if (!plan || plan.statusConceptId !== INS.PLAN_ACTIVE) {
    // Sin esta comprobación el alta moriría en un error de integridad que no le
    // dice nada a nadie; con ella, el fallo nombra el problema.
    throw new BadRequestException(
      'El plan de salud indicado no está disponible',
    );
  }

  const yaExiste = await repos.coverage.findByMemberAndPlan(
    tx,
    data.memberIdentifier,
    data.insurancePlanId,
  );
  if (yaExiste) {
    // Puede pasar si alguien ya cargó la cobertura de esta persona antes de que
    // ella se registrara. Duplicarla sería peor que omitirla, y hacer fracasar
    // el alta entera por un dato opcional, peor todavía.
    logger.warn(
      `Cobertura ya registrada para el documento y plan declarados; se omite (perfil ${data.patientProfileId})`,
    );
    return false;
  }

  repos.coverage.createCoverage(tx, {
    patientProfileId: data.patientProfileId,
    insurancePlanId: data.insurancePlanId,
    memberIdentifier: data.memberIdentifier,
    coverageOrder: data.coverageOrder,
    relationshipToSubscriberConceptId: INS.RELATIONSHIP_SELF,
    verificationStatusConceptId: INS.VERIFY_PENDING,
    statusConceptId: INS.COVERAGE_ACTIVE,
    actorUserId: data.actorUserId,
  });
  return true;
}
