import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import { PatientReportedHealthStatementsRepository } from '../repositories';
import type { PatientReportedHealthStatements } from '../entities';
import { MedicalAspectsResponseDto, UpdateOwnMedicalAspectsDto } from '../dto';

/** Mismo texto para «sin perfil» y «sin vínculo»: no se distingue por qué. */
const SIN_PERFIL_DE_PACIENTE =
  'La sesión no tiene un perfil de paciente sobre el que declarar.';

/**
 * Campo del contrato → columna de la declaración. Es la única lista: el DTO,
 * la respuesta y el UPSERT se recorren con ella para que un campo nuevo no
 * pueda entrar en uno y faltar en otro.
 */
const FIELD_TO_COLUMN = {
  bloodType: 'bloodTypeText',
  allergiesText: 'allergiesText',
  chronicConditionsText: 'chronicConditionsText',
  currentMedicationsText: 'currentMedicationsText',
  surgeriesText: 'surgeriesText',
  familyHistoryText: 'familyHistoryText',
  habitsText: 'habitsText',
} as const satisfies Record<
  keyof UpdateOwnMedicalAspectsDto,
  keyof PatientReportedHealthStatements
>;

type AspectField = keyof typeof FIELD_TO_COLUMN;

/**
 * FT-22 / D-B: los «aspectos médicos» que la persona declara de su salud.
 *
 * El titular **sale de la sesión**: cuenta → vínculo activo → perfil de
 * paciente, con la misma resolución que `ClinicalReadService.assertOwnRecord`.
 * Ninguna ruta acepta un id de paciente. Un usuario sin perfil de paciente
 * recibe 403.
 *
 * `PUT` = un caso de uso = una transacción: UPSERT de la fila del titular, con
 * «campo ausente = no tocar, `''` = borrar». `row_version` lo gestiona el ORM;
 * como el contrato no manda versión, entre dos pestañas gana la última
 * escritura (registrado en D-B).
 */
@Injectable()
export class MedicalAspectsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param statementsRepo - Acceso a la declaración del titular.
   * @param accountLinksRepo - Cuenta → persona.
   * @param patientProfilesRepo - Persona → perfil de paciente.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly statementsRepo: PatientReportedHealthStatementsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicalAspectsService.name);
  }

  /** `GET /clinical/me/medical-aspects`: lo declarado, o `{}` si nunca declaró. */
  async getOwn(actor: AuthenticatedUser): Promise<MedicalAspectsResponseDto> {
    const em = this.em.fork();
    const patientProfileId = await this.resolveOwnPatientProfileId(em, actor);
    const row = await this.statementsRepo.findByPatient(em, patientProfileId);
    this.logger.info(
      { operation: 'clinical.medicalAspects.read', patientProfileId },
      'Reading patient-reported health statement',
    );
    return row ? this.toResponse(row) : {};
  }

  /** `PUT /clinical/me/medical-aspects`: UPSERT parcial y estado completo. */
  async updateOwn(
    dto: UpdateOwnMedicalAspectsDto,
    actor: AuthenticatedUser,
  ): Promise<MedicalAspectsResponseDto> {
    return this.em.transactional(async (tx) => {
      const patientProfileId = await this.resolveOwnPatientProfileId(tx, actor);
      let row = await this.statementsRepo.findByPatient(tx, patientProfileId);
      if (!row) {
        row = this.statementsRepo.create(tx, {
          patientProfileId,
          actorUserId: actor.id,
        });
      }
      // PHI: se registran las claves tocadas, nunca su contenido.
      const touched: AspectField[] = [];
      for (const field of Object.keys(FIELD_TO_COLUMN) as AspectField[]) {
        const value = dto[field];
        if (value === undefined) continue;
        touched.push(field);
        const trimmed = value.trim();
        row[FIELD_TO_COLUMN[field]] = trimmed === '' ? undefined : trimmed;
      }
      touch(row, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical.medicalAspects.update',
          patientProfileId,
          fields: touched,
        },
        'Patient-reported health statement updated',
      );
      return this.toResponse(row);
    });
  }

  /**
   * Cuenta → vínculo activo → perfil de paciente. `profile_id` es el id de la
   * persona (misma traducción que `assertOwnRecord`). Sin vínculo o sin perfil
   * de paciente → 403, con el mismo texto en los dos casos.
   */
  private async resolveOwnPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const perfil = link
      ? await this.patientProfilesRepo.findById(em, link.personId)
      : null;
    if (!link || !perfil) {
      this.logger.warn(
        { operation: 'clinical.medicalAspects.denied', userId: actor.id },
        'Sesión sin perfil de paciente intentó declarar aspectos médicos',
      );
      throw new ForbiddenException(SIN_PERFIL_DE_PACIENTE);
    }
    return perfil.profileId;
  }

  /** Proyecta la fila al contrato, omitiendo lo que nunca se declaró. */
  private toResponse(
    row: PatientReportedHealthStatements,
  ): MedicalAspectsResponseDto {
    const out: MedicalAspectsResponseDto = { updatedAt: row.updatedAt };
    for (const field of Object.keys(FIELD_TO_COLUMN) as AspectField[]) {
      const value = row[FIELD_TO_COLUMN[field]];
      if (typeof value === 'string' && value !== '') out[field] = value;
    }
    return out;
  }
}
