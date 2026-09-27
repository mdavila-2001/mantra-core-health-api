import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  AllergyIntolerancesRepository,
  EncountersRepository,
} from '../repositories';
import {
  AttachFileToAllergyIntoleranceDto,
  CreateAllergyIntoleranceDto,
  AllergyIntoleranceResponseDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';
// P25 (BR-11): adjuntar un archivo ya subido a una alergia puntual, calcado de
// `ProceduresService.attachFile`.
import { FilesService } from '../../common/services';
import {
  OwnerType,
  type FileLinkResponseDto,
  type LinkedFilePageDto,
} from '../../common/dto';
import { ClinicalReadService } from './clinical-read.service';

/** UC-08-09: registro de alergias/intolerancias con reacciones (CDS). */
@Injectable()
export class AllergyIntolerancesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param allergyRepo - Valor de allergy repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param encountersRepo - Resuelve el encuentro en el que se detectó (P26).
   * @param filesService - Vincula archivos ya subidos a una alergia puntual (P25).
   * @param clinicalRead - Política de escritura sobre la historia (MCH-007).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly allergyRepo: AllergyIntolerancesRepository,
    private readonly logger: PinoLogger,
    private readonly encountersRepo: EncountersRepository,
    private readonly filesService: FilesService,
    private readonly clinicalRead: ClinicalReadService,
  ) {
    this.logger.setContext(AllergyIntolerancesService.name);
  }

  /**
   * P26 / CL-01: el encuentro en el que se detectó tiene que ser del mismo
   * paciente. Una alergia colgada de la consulta de otra persona no es un dato
   * incompleto: es un dato falso. Se rechaza con 422, no con 404 — el recurso
   * que falla no es la alergia sino la precondición del cuerpo (mismo criterio
   * que `indicationConditionId` en las recetas).
   */
  private async assertEncounterBelongsToPatient(
    tx: EntityManager,
    encounterId: string,
    patientProfileId: string,
  ): Promise<void> {
    const encounter = await this.encountersRepo.findById(tx, encounterId);
    if (encounter?.patientProfileId !== patientProfileId) {
      throw new PreconditionFailedException(
        'El encuentro indicado no existe o no pertenece a este paciente',
        { encounterId, patientProfileId },
      );
    }
  }

  /** UC-08-09: registra una alergia y sus reacciones, sin duplicar por sustancia. */
  async create(
    dto: CreateAllergyIntoleranceDto,
    actor: AuthenticatedUser,
  ): Promise<AllergyIntoleranceResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.allergy.create',
        patientProfileId: dto.patientProfileId,
      },
      'Recording allergy',
    );
    return this.em.transactional(async (tx) => {
      if (dto.encounterId !== undefined) {
        await this.assertEncounterBelongsToPatient(
          tx,
          dto.encounterId,
          dto.patientProfileId,
        );
      }
      const existing = await this.allergyRepo.findActiveBySubstance(
        tx,
        dto.custodianTenantId,
        dto.patientProfileId,
        dto.substanceConceptId,
        CLIN.ALLERGY_ACTIVE,
      );
      if (existing) {
        throw new ConflictException(
          'El paciente ya tiene una alergia activa a esa sustancia',
          {
            patientProfileId: dto.patientProfileId,
            substanceConceptId: dto.substanceConceptId,
          },
        );
      }

      const allergy = this.allergyRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        substanceConceptId: dto.substanceConceptId,
        typeConceptId: dto.typeConceptId,
        categoryConceptId: dto.categoryConceptId,
        criticalityConceptId: dto.criticalityConceptId,
        clinicalStatusConceptId: CLIN.ALLERGY_ACTIVE,
        verificationStatusConceptId: CLIN.ALLERGY_CONFIRMED,
        recordedByUserId: actor.id,
        actorUserId: actor.id,
      });
      // FK plana: persistir la alergia antes de sus reacciones.
      await tx.flush();

      const reactionIds: string[] = [];
      for (const r of dto.reactions ?? []) {
        const reaction = this.allergyRepo.createReaction(tx, {
          allergyId: allergy.id,
          manifestationConceptId: r.manifestationConceptId,
          severityConceptId: r.severityConceptId,
          description: r.description,
          actorUserId: actor.id,
        });
        reactionIds.push(reaction.id);
      }
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.allergy.create', allergyId: allergy.id },
        'Allergy recorded',
      );
      return {
        id: allergy.id,
        patientProfileId: allergy.patientProfileId,
        encounterId: allergy.encounterId ?? null,
        clinicalStatus: allergy.clinicalStatusConceptId ?? null,
        reactionIds,
        createdAt: allergy.createdAt,
      };
    });
  }

  /**
   * P25 (BR-11): liga un archivo ya subido a esta alergia puntual. 404 antes de
   * autorizar; el paciente sale de la fila, nunca del cuerpo (MCH-007).
   */
  async attachFile(
    allergyId: string,
    dto: AttachFileToAllergyIntoleranceDto,
    actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    const allergy = await this.allergyRepo.findById(this.em, allergyId);
    if (!allergy) {
      throw new ResourceNotFoundException('Alergia no encontrada', {
        allergyId,
      });
    }
    await this.clinicalRead.assertPuedeEscribirHistoria(
      allergy.patientProfileId,
      actor,
    );
    this.logger.info(
      {
        operation: 'clinical.allergy.attach_file',
        allergyId,
        fileId: dto.fileId,
      },
      'Attaching file to allergy',
    );
    return this.filesService.createLink(
      dto.fileId,
      { ownerType: OwnerType.ALLERGY_INTOLERANCE, ownerId: allergy.id },
      actor,
    );
  }

  /**
   * P25 (BR-11 §1.C): los adjuntos de una alergia, por la ruta clínica. 404
   * antes de autorizar; listar es leer la historia (`assertPuedeLeerHistoria`).
   */
  async listAttachments(
    allergyId: string,
    actor: AuthenticatedUser,
  ): Promise<LinkedFilePageDto> {
    const allergy = await this.allergyRepo.findById(this.em, allergyId);
    if (!allergy) {
      throw new ResourceNotFoundException('Alergia no encontrada', {
        allergyId,
      });
    }
    await this.clinicalRead.assertPuedeLeerHistoria(
      allergy.patientProfileId,
      actor,
    );
    return this.filesService.listLinkedFilesOf(
      OwnerType.ALLERGY_INTOLERANCE,
      allergy.id,
    );
  }
}
