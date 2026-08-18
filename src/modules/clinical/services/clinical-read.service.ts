import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import {
  AllergyIntolerancesRepository,
  CareEpisodesRepository,
  ConditionsRepository,
  EncountersRepository,
  MedicationRequestsRepository,
  ObservationsRepository,
} from '../repositories';
// Los dos repositorios que resuelven «esta historia es tuya»: cuenta → persona
// → perfil. Se proveen en `ClinicalModule` como `scheduling` provee
// `AppointmentsRepository`: son clases sin estado que reciben el
// `EntityManager` por parámetro, así que no duplican fuente de verdad ni
// arrastran el módulo de perfiles entero.
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import type { PatientClinicalSummaryResponseDto } from '../dto';

/**
 * Cara de lectura del registro clínico (UC-39-20).
 *
 * El módulo `clinical` era íntegramente de escritura: doce endpoints para
 * registrar condiciones, alergias, medicación, procedimientos, inmunizaciones y
 * observaciones, y ninguno para volver a leerlos. Una historia clínica que sólo
 * se puede escribir no es una historia clínica.
 *
 * Devuelve los cinco bloques juntos porque es una sola pantalla —la cabecera
 * clínica del paciente— y porque las alergias, en particular, no deben depender
 * de que el cliente se acuerde de pedirlas en una llamada aparte.
 */
@Injectable()
export class ClinicalReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param conditionsRepo - Acceso a condiciones.
   * @param allergiesRepo - Acceso a alergias e intolerancias.
   * @param medicationRequestsRepo - Acceso a prescripciones.
   * @param observationsRepo - Acceso a observaciones.
   * @param encountersRepo - Acceso a encuentros.
   * @param episodesRepo - Acceso a episodios de cuidado (internaciones).
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly allergiesRepo: AllergyIntolerancesRepository,
    private readonly medicationRequestsRepo: MedicationRequestsRepository,
    private readonly observationsRepo: ObservationsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalReadService.name);
  }

  /**
   * Exige que la historia pedida sea **la propia** (carril 09).
   *
   * ## Por qué se resuelve contra la base y no contra el token
   *
   * El claim `pid` existe, pero su propia documentación dice que **no es una
   * credencial y no participa de ninguna decisión de autorización**. Usarlo acá
   * convertiría un dato de comodidad —puesto en el token para que el portal no
   * tuviera que pedirlo— en la única barrera que separa la historia clínica de
   * una persona de la de otra.
   *
   * Así que se resuelve como lo resuelve el resto del sistema: del vínculo
   * activo entre la cuenta y su persona, y de ahí al perfil. Son dos consultas
   * y ocurren una vez por lectura.
   *
   * ## Qué se compara, y por qué se comparaba mal
   *
   * `patient_profiles.profile_id` **es** el identificador de la persona: los
   * subtipos de `profiles` se identifican por ella y no por una fila
   * intermedia. Es la regla que `ProfileOwnershipService` ya declara para los
   * mismos perfiles, y la que esta comprobación se había apartado: buscaba en
   * `person_profiles` **por su `id`** usando un id de persona. Esa fila no
   * existe nunca, así que el titular quedaba fuera de su propia historia con un
   * 403 permanente — no en un caso borde, en todos.
   *
   * Comprobado sobre la base: de 16 perfiles de paciente, los 16 tienen
   * `profile_id` apuntando a una persona y ninguno a un `person_profiles.id`.
   *
   * ## Qué NO relaja el bypass de verificación
   *
   * Esto. El bypass de DEV (corrección #12) exime de estar verificado, no de
   * ser el titular: un paciente sin verificar ve su historia, y ninguna otra.
   *
   * @param patientProfileId - La historia que se quiere leer.
   * @param actor - Quién la pide.
   * @throws ForbiddenException si no es la suya.
   */
  async assertOwnRecord(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const perfil = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );

    if (!link || !perfil || perfil.profileId !== link.personId) {
      this.logger.warn(
        {
          operation: 'clinical.patient.read.denied',
          patientProfileId,
          userId: actor.id,
        },
        'Intento de leer una historia clínica ajena',
      );
      throw new ForbiddenException(
        'Sólo podés consultar tu propia historia clínica.',
      );
    }
  }

  /**
   * UC-39-20: historial clínico del paciente.
   *
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope por bloque.
   * @returns Condiciones, alergias, medicación, observaciones, encuentros y
   *          episodios de cuidado.
   */
  async getPatientSummary(
    patientProfileId: string,
    limit: number,
  ): Promise<PatientClinicalSummaryResponseDto> {
    this.logger.info(
      { operation: 'clinical.patient.read', patientProfileId, limit },
      'Leyendo historial clínico del paciente',
    );

    const em = this.em.fork();
    const over = limit + 1;

    const [
      conditions,
      allergies,
      medicationRequests,
      observations,
      encounters,
      careEpisodes,
    ] = await Promise.all([
      this.conditionsRepo.findByPatient(em, patientProfileId, over),
      this.allergiesRepo.findByPatient(em, patientProfileId, over),
      this.medicationRequestsRepo.findByPatient(em, patientProfileId, over),
      this.observationsRepo.findByPatient(em, patientProfileId, over),
      this.encountersRepo.findByPatient(em, patientProfileId, over),
      this.episodesRepo.findByPatient(em, patientProfileId, over),
    ]);

    const truncated: string[] = [];

    return {
      patientProfileId,
      conditions: this.cut(conditions, limit, 'conditions', truncated).map(
        (row) => ({
          id: row.id,
          codeConceptId: row.codeConceptId,
          categoryConceptId: row.categoryConceptId,
          clinicalStatusConceptId: row.clinicalStatusConceptId,
          verificationStatusConceptId: row.verificationStatusConceptId,
          severityConceptId: row.severityConceptId,
          encounterId: row.encounterId,
          onsetAt: row.onsetAt,
          resolvedAt: row.resolvedAt,
          createdAt: row.createdAt,
        }),
      ),
      allergies: this.cut(allergies, limit, 'allergies', truncated).map(
        (row) => ({
          id: row.id,
          substanceConceptId: row.substanceConceptId,
          typeConceptId: row.typeConceptId,
          categoryConceptId: row.categoryConceptId,
          criticalityConceptId: row.criticalityConceptId,
          clinicalStatusConceptId: row.clinicalStatusConceptId,
          createdAt: row.createdAt,
        }),
      ),
      medicationRequests: this.cut(
        medicationRequests,
        limit,
        'medicationRequests',
        truncated,
      ).map((row) => ({
        id: row.id,
        medicationConceptId: row.medicationConceptId,
        statusConceptId: row.statusConceptId,
        prescriberProfileId: row.prescriberProfileId,
        doseText: row.doseText,
        frequencyText: row.frequencyText,
        validFrom: row.validFrom,
        validTo: row.validTo,
        signedAt: row.signedAt,
        issuedAt: row.issuedAt,
        createdAt: row.createdAt,
      })),
      observations: this.cut(
        observations,
        limit,
        'observations',
        truncated,
      ).map((row) => ({
        id: row.id,
        codeConceptId: row.codeConceptId,
        statusConceptId: row.statusConceptId,
        interpretationConceptId: row.interpretationConceptId,
        valueDecimal: row.valueDecimal,
        valueText: row.valueText,
        valueBoolean: row.valueBoolean,
        valueConceptId: row.valueConceptId,
        quantityValue: row.quantityValue,
        quantityUnitConceptId: row.quantityUnitConceptId,
        effectiveStartAt: row.effectiveStartAt,
        encounterId: row.encounterId,
      })),
      encounters: this.cut(encounters, limit, 'encounters', truncated).map(
        (row) => ({
          id: row.id,
          episodeId: row.episodeId,
          statusConceptId: row.statusConceptId,
          classConceptId: row.classConceptId,
          primaryPractitionerId: row.primaryPractitionerId,
          reasonText: row.reasonText,
          startAt: row.startAt,
          endAt: row.endAt,
        }),
      ),
      careEpisodes: this.cut(
        careEpisodes,
        limit,
        'careEpisodes',
        truncated,
      ).map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        typeConceptId: row.typeConceptId,
        statusConceptId: row.statusConceptId,
        responsiblePractitionerId: row.responsiblePractitionerId,
        startAt: row.startAt,
        endAt: row.endAt,
        createdAt: row.createdAt,
      })),
      limit,
      truncated,
    };
  }

  /**
   * Recorta el bloque al tope y anota su nombre si sobraba.
   *
   * @param rows - Filas leídas, con una de más.
   * @param limit - Tope del bloque.
   * @param name - Nombre del bloque en la respuesta.
   * @param truncated - Acumulador de bloques recortados.
   * @returns Las filas del bloque, ya recortadas.
   */
  private cut<T>(
    rows: T[],
    limit: number,
    name: string,
    truncated: string[],
  ): T[] {
    if (rows.length > limit) {
      truncated.push(name);
      return rows.slice(0, limit);
    }
    return rows;
  }
}
