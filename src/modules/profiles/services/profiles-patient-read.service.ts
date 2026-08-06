import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../../../common';
import {
  PatientProfilesRepository,
  PatientReadRepository,
  PersonsRepository,
} from '../repositories';
import {
  PatientFiliationResponseDto,
  PatientSearchItemDto,
  SearchPatientsQueryDto,
  SearchPatientsResponseDto,
} from '../dto';

const DEFAULT_SEARCH_LIMIT = 25;

/**
 * Lectura de filiación del paciente.
 *
 * El módulo sólo exponía `GET /profiles/patients/me/summary`, que además exige
 * identidad verificada porque el paciente se consulta a sí mismo. No había
 * forma de que un profesional leyera la filiación de *otro*: la pantalla F-01
 * no tenía de dónde leer.
 */
@Injectable()
export class ProfilesPatientReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientReadRepo - Repositorio de lectura de filiación.
   * @param patientProfilesRepo - Repositorio de perfiles de paciente.
   * @param personsRepo - Repositorio de personas.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly patientReadRepo: PatientReadRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProfilesPatientReadService.name);
  }

  /** Búsqueda de pacientes por nombre o por código. */
  async searchPatients(
    query: SearchPatientsQueryDto,
  ): Promise<SearchPatientsResponseDto> {
    const limit = query.limit ?? DEFAULT_SEARCH_LIMIT;
    const offset = query.offset ?? 0;
    const em = this.em.fork();

    const rows = await this.patientReadRepo.searchPatients(
      em,
      { query: query.query, patientCode: query.patientCode },
      limit,
      offset,
    );

    const items: PatientSearchItemDto[] = rows
      .slice(0, limit)
      .map(({ profile, person }) => ({
        patientProfileId: profile.profileId,
        personId: profile.profileId,
        patientCode: profile.patientCode,
        displayName: person?.displayName ?? null,
        birthDate: this.toDateOnly(person?.birthDate),
        personStatusConceptId: person?.personStatusConceptId ?? '',
      }));

    return { items, count: items.length, limit, offset };
  }

  /** Filiación completa del paciente (F-01). */
  async getFiliation(profileId: string): Promise<PatientFiliationResponseDto> {
    const em = this.em.fork();

    const profile = await this.patientProfilesRepo.findById(em, profileId);
    if (!profile) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        profileId,
      });
    }
    // `patient_profiles.profile_id` referencia directamente a `persons.id`: el
    // perfil de paciente y la persona comparten identificador.
    const person = await this.personsRepo.findById(em, profile.profileId);
    if (!person) {
      throw new ResourceNotFoundException(
        'Persona del paciente no encontrada',
        {
          profileId,
        },
      );
    }

    const identityLinks = await this.patientReadRepo.findIdentityLinks(
      em,
      profileId,
    );
    const relatedPersons = await this.patientReadRepo.findRelatedPersons(
      em,
      profileId,
    );

    return {
      patientProfileId: profile.profileId,
      personId: person.id,
      patientCode: profile.patientCode,
      masterPatientIndexCode: profile.masterPatientIndexCode ?? null,
      displayName: person.displayName ?? null,
      birthDate: this.toDateOnly(person.birthDate),
      administrativeGenderConceptId:
        person.administrativeGenderConceptId ?? null,
      sexAtBirthConceptId: person.sexAtBirthConceptId ?? null,
      genderIdentityConceptId: person.genderIdentityConceptId ?? null,
      nationalityConceptId: person.nationalityConceptId ?? null,
      preferredLanguageConceptId: person.preferredLanguageConceptId ?? null,
      personStatusConceptId: person.personStatusConceptId,
      vitalStatusConceptId: person.vitalStatusConceptId ?? null,
      deceasedAt: person.deceasedAt?.toISOString() ?? null,
      aboGroupConceptId: profile.aboGroupConceptId ?? null,
      rhFactorConceptId: profile.rhFactorConceptId ?? null,
      insuranceStatusConceptId: profile.insuranceStatusConceptId ?? null,
      clinicalLanguageConceptId: profile.clinicalLanguageConceptId ?? null,
      recordLinkageStatusConceptId:
        profile.recordLinkageStatusConceptId ?? null,
      identityLinks: identityLinks.map((link) => ({
        id: link.id,
        sourceTenantId: link.sourceTenantId,
        sourcePatientIdentifier: link.sourcePatientIdentifier,
        sourceSystemUri: link.sourceSystemUri ?? null,
        verificationStatusConceptId: link.verificationStatusConceptId,
      })),
      relatedPersons: relatedPersons.map(({ link, person: related }) => ({
        id: link.id,
        personId: link.personId,
        displayName: related?.displayName ?? null,
        relationshipConceptId: link.relationshipConceptId,
        isEmergencyContact: link.isEmergencyContact,
        isLegalGuardian: link.isLegalGuardian,
        statusConceptId: link.statusConceptId,
      })),
      createdAt: profile.createdAt.toISOString(),
    };
  }

  /**
   * Normaliza una columna `date` a `YYYY-MM-DD`.
   *
   * El tipado la declara `Date`, pero el driver puede devolverla ya como cadena.
   * Serializar un `Date` sin más añadiría una hora inventada a una fecha de
   * nacimiento, que además se desplazaría al cambiar de zona horaria.
   */
  private toDateOnly(value: Date | string | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }
}
