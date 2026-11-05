import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import type { PatientPrimaryPractitioners } from '../../entities';
import {
  HealthPractitionerProfilesRepository,
  PatientPrimaryPractitionersRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../infrastructure/repositories';
import {
  PRIMARY_PATIENTS_DEFAULT_LIMIT,
  type ListPrimaryPatientsQueryDto,
  type OwnPrimaryPractitionerDto,
  type PrimaryPatientsPageDto,
} from '../../presentation/dto/primary-practitioner.dto';
import { ProfilesErrorReason } from '../../profiles.error-reasons';

/**
 * El **médico de cabecera**: el profesional que el paciente elige, con un
 * botón, como su médico personal (pedido del 28/10/2026, v4.2.65).
 *
 * ## Quién decide
 *
 * Sólo el paciente, y sólo el suyo: todas las rutas del paciente son `me` y la
 * persona sale de la sesión. El profesional no se asigna pacientes: ve
 * quiénes lo eligieron.
 *
 * ## Qué NO concede
 *
 * Ningún acceso clínico. Elegir a alguien como médico de cabecera no le abre
 * la historia: eso sigue siendo del consentimiento y de authz. La lista del
 * profesional trae nombre, código y desde cuándo — nada del expediente.
 *
 * ## Historia
 *
 * Cada elección es un período. Cambiar de médico cierra la vigente y abre
 * otra; quitarlo la cierra. Nada se borra. Que haya una sola vigente por
 * paciente lo garantiza la base (`uq_patient_primary_practitioners_current`);
 * si dos pestañas eligen a la vez, una gana y la otra recibe 409.
 */
@Injectable()
export class PrimaryPractitionerService {
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly primaryRepo: PatientPrimaryPractitionersRepository,
    private readonly logger: PinoLogger,
  ) {}

  /** El médico de cabecera vigente del paciente de la sesión, o ninguno. */
  async getOwn(actor: AuthenticatedUser): Promise<OwnPrimaryPractitionerDto> {
    const em = this.em.fork();
    const patientId = await this.resolveOwnPatientId(em, actor);
    return this.present(
      em,
      await this.primaryRepo.findCurrentByPatient(em, patientId),
    );
  }

  /**
   * Elige (o cambia) el médico de cabecera.
   *
   * Elegir al que ya es el vigente no abre otro período: devuelve el mismo,
   * para que el botón pulsado dos veces no reescriba el «desde».
   */
  async setOwn(
    practitionerProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<OwnPrimaryPractitionerDto> {
    this.logger.info(
      {
        operation: 'profiles.patient.primaryPractitioner.set',
        actorId: actor.id,
        practitionerProfileId,
      },
      'Setting primary practitioner',
    );
    return this.write(actor, async (tx, patientId, current, now) => {
      if (current?.practitionerProfileId === practitionerProfileId) return;

      if (practitionerProfileId === patientId) {
        throw new PreconditionFailedException(
          'No puede elegirse a sí mismo como médico de cabecera.',
          {},
          ProfilesErrorReason.PRIMARY_PRACTITIONER_SELF,
        );
      }
      const practitioner = await this.practitionersRepo.findById(
        tx,
        practitionerProfileId,
      );
      if (!practitioner) {
        throw new ResourceNotFoundException(
          'Profesional no encontrado',
          {},
          ProfilesErrorReason.PRACTITIONER_PROFILE_NOT_FOUND,
        );
      }
      // Sólo un `false` explícito cierra la puerta: sin declarar no es «no».
      if (practitioner.acceptsNewPatients === false) {
        throw new PreconditionFailedException(
          'Este profesional no está aceptando pacientes nuevos.',
          {},
          ProfilesErrorReason.PRIMARY_PRACTITIONER_NOT_ACCEPTING_PATIENTS,
        );
      }

      // Cerrar y abrir en dos tiempos: el índice único de la vigente no es
      // diferible, y la vieja tiene que dejar de estar vigente antes.
      if (current) {
        this.primaryRepo.close(current, now, actor.id);
        await tx.flush();
      }
      this.primaryRepo.open(
        tx,
        {
          patientProfileId: patientId,
          practitionerProfileId,
          actorUserId: actor.id,
        },
        now,
      );
    });
  }

  /** Quita el médico de cabecera. Sin uno vigente, no hace nada. */
  async removeOwn(
    actor: AuthenticatedUser,
  ): Promise<OwnPrimaryPractitionerDto> {
    this.logger.info(
      {
        operation: 'profiles.patient.primaryPractitioner.remove',
        actorId: actor.id,
      },
      'Removing primary practitioner',
    );
    return this.write(actor, (_tx, _patientId, current, now) => {
      if (current) this.primaryRepo.close(current, now, actor.id);
      return Promise.resolve();
    });
  }

  /**
   * Los pacientes que eligieron al profesional de la sesión como médico de
   * cabecera, los más recientes primero.
   */
  async listOwnPatients(
    query: ListPrimaryPatientsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PrimaryPatientsPageDto> {
    const em = this.em.fork();
    const practitionerId = await this.resolveOwnPractitionerId(em, actor);
    const limit = query.limit ?? PRIMARY_PATIENTS_DEFAULT_LIMIT;
    const offset = query.offset ?? 0;
    const { rows, total } = await this.primaryRepo.listCurrentPatients(
      em,
      practitionerId,
      { limit, offset },
    );
    return { items: rows, total, limit, offset };
  }

  /**
   * La unidad de trabajo de las escrituras: resolver al paciente, leer su
   * elección vigente, aplicar el cambio y devolverla releída.
   */
  private async write(
    actor: AuthenticatedUser,
    change: (
      tx: EntityManager,
      patientId: string,
      current: PatientPrimaryPractitioners | null,
      now: Date,
    ) => Promise<void>,
  ): Promise<OwnPrimaryPractitionerDto> {
    try {
      return await this.em.transactional(async (tx) => {
        const patientId = await this.resolveOwnPatientId(tx, actor);
        const current = await this.primaryRepo.findCurrentByPatient(
          tx,
          patientId,
        );
        await change(tx, patientId, current, new Date());
        await tx.flush();
        return this.present(
          tx,
          await this.primaryRepo.findCurrentByPatient(tx, patientId),
        );
      });
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Su médico de cabecera cambió mientras lo elegía. Vuelva a intentarlo.',
        );
      }
      throw error;
    }
  }

  private async present(
    em: EntityManager,
    current: PatientPrimaryPractitioners | null,
  ): Promise<OwnPrimaryPractitionerDto> {
    if (!current) return { current: null };
    const [displayName, practitioner] = await Promise.all([
      this.primaryRepo.findPractitionerName(em, current.practitionerProfileId),
      this.practitionersRepo.findById(em, current.practitionerProfileId),
    ]);
    return {
      current: {
        practitionerProfileId: current.practitionerProfileId,
        displayName,
        professionalTitle: practitioner?.professionalTitle,
        since: current.validFrom,
      },
    };
  }

  private async resolveOwnPatientId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const personId = await this.resolveOwnPersonId(em, actor);
    const patient = await this.patientProfilesRepo.findById(em, personId);
    if (!patient) {
      throw new ResourceNotFoundException(
        'Paciente no encontrado',
        {},
        ProfilesErrorReason.PATIENT_PROFILE_NOT_FOUND,
      );
    }
    return personId;
  }

  private async resolveOwnPractitionerId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const personId = await this.resolveOwnPersonId(em, actor);
    const practitioner = await this.practitionersRepo.findById(em, personId);
    if (!practitioner) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil profesional',
        {},
        ProfilesErrorReason.ACCOUNT_WITHOUT_PRACTITIONER_PROFILE,
      );
    }
    return personId;
  }

  private async resolveOwnPersonId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
        {},
        ProfilesErrorReason.ACCOUNT_WITHOUT_LINKED_PERSON,
      );
    }
    return link.personId;
  }
}
