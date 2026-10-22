import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { ProcessingLegalBases } from '../../modules/consent/entities';
import { CONS } from '../../modules/consent/consent.concepts';
import { CONCEPTS, SEED } from '../constants/concepts';
import { valueSetCanonicalUrl } from './dynamic-enum-catalog';

/** Nombre del conjunto; `ValueSets.name` no tiene idioma declarado y la plataforma es ES. */
const SCOPE_VALUE_SET_NAME = 'Alcance del apoderado de portal';

/** Versión única del conjunto, marcada vigente. */
const SCOPE_VERSION = '1';

/** Referencia legal de la base que ampara la representación de un dependiente. */
const LEGAL_REFERENCE_URI =
  'https://www.oas.org/dil/esp/Codigo_Nino_Nina_Adolescente_Bolivia.pdf';

/**
 * Siembra las dos filas sin las que un apoderamiento de portal no se puede
 * escribir: el conjunto de valores que declara su alcance y la base legal que
 * lo ampara.
 *
 * ## Por qué hacía falta
 *
 * `profiles.patient_portal_proxies` tiene dos FK **NOT NULL** —
 * `scope_value_set_id` y `legal_basis_record_id`— y nadie sembraba ninguna de
 * las dos. El único escritor de apoderamientos era
 * `POST /profiles/patients/{id}/portal-proxies`, que exige `SECURITY_ADMIN` y
 * recibe los dos identificadores **del cliente**: en la práctica la tabla no se
 * podía usar sin que alguien creara a mano un conjunto y una base legal. Desde
 * que el propio titular registra a sus dependientes, la plataforma tiene que
 * aportarlas.
 *
 * ## Por qué el conjunto va sin miembros
 *
 * Porque qué puede hacer exactamente un apoderado todavía no está decidido, y
 * sembrar tres o cuatro permisos inventados dejaría escrito en la base un
 * acuerdo que nadie tomó. El conjunto existe para que la columna tenga a qué
 * apuntar y para que el día que se acote el alcance haya dónde ponerlo. No es
 * una enumeración dinámica: `DYNAMIC_ENUM_CATALOG` ata columnas
 * `*_concept_id` a un conjunto, y ésta apunta al conjunto mismo.
 *
 * ## Por qué la base legal no es consentimiento
 *
 * `CONS.LEGAL_BASIS_CONSENT` sería lo cómodo y sería falso: un menor de tres
 * años no consiente que su madre vea sus estudios. Lo que ampara ese acceso es
 * la representación legal, que es una base distinta y propia.
 *
 * ## Idempotencia
 *
 * Los tres identificadores son deterministas y cada fila se guarda sólo si
 * falta. Una segunda corrida inserta cero, que es lo que comprueba
 * `seed.int-spec.ts`.
 */
@Injectable()
export class PatientPortalProxySeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - De donde sale el contexto de persistencia bifurcado.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientPortalProxySeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que `yarn seed:boot` y el arnés de
   * integración puedan garantizarlo por su cuenta.
   *
   * @returns Cuántas filas insertó esta pasada, por nivel.
   */
  async run(): Promise<{
    /** Conjuntos de valores creados (0 ó 1). */
    valueSets: number;
    /** Versiones de conjunto creadas (0 ó 1). */
    versions: number;
    /** Bases legales creadas (0 ó 1). */
    legalBases: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    const counters = { valueSets: 0, versions: 0, legalBases: 0 };

    if (
      !(await em.findOne(ValueSets, {
        id: SEED.patientPortalProxyScopeValueSetId,
      }))
    ) {
      em.create(
        ValueSets,
        {
          id: SEED.patientPortalProxyScopeValueSetId,
          internalCode: SEED.patientPortalProxyScopeCode,
          name: SCOPE_VALUE_SET_NAME,
          canonicalUrl: valueSetCanonicalUrl(SEED.patientPortalProxyScopeCode),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
    }
    await em.flush();

    if (
      !(await em.findOne(ValueSetVersions, {
        id: SEED.patientPortalProxyScopeVersionId,
      }))
    ) {
      em.create(
        ValueSetVersions,
        {
          id: SEED.patientPortalProxyScopeVersionId,
          valueSetId: SEED.patientPortalProxyScopeValueSetId,
          version: SCOPE_VERSION,
          validFrom: now,
          // Sin esta marca, una lectura de la expansión devolvería 404 aunque el
          // conjunto exista: `readExpansion` sin versión explícita busca la vigente.
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.versions += 1;
    }
    await em.flush();

    if (
      !(await em.findOne(ProcessingLegalBases, {
        id: SEED.guardianProxyLegalBasisId,
      }))
    ) {
      em.create(
        ProcessingLegalBases,
        {
          id: SEED.guardianProxyLegalBasisId,
          tenantId: SEED.tenantId,
          processingPurposeId: SEED.processingPurposeId,
          jurisdictionConceptId: CONS.JURISDICTION_BO,
          generalLegalBasisConceptId: CONS.LEGAL_BASIS_LEGAL_REPRESENTATION,
          policyVersion: '1.0.0',
          legalReferenceUri: LEGAL_REFERENCE_URI,
          validFrom: now,
          statusConceptId: CONS.LEGAL_BASIS_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.legalBases += 1;
    }
    await em.flush();

    this.logger.info(
      { operation: 'seed.patient-portal-proxy', ...counters },
      'Patient portal proxy scope and legal basis ensured',
    );
    return counters;
  }
}
