import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { PROF } from '../../../profiles.concepts';
import { PractitionerSpecialtiesRepository } from '../../../infrastructure/repositories';
import { ProfileOwnershipService } from '../../services/profile-ownership.service';
import { MedicalSpecialtyCatalogService } from '../../services/medical-specialty-catalog.service';
import type {
  SpecialtyResponseDto,
  UpdateOwnSpecialtyDto,
} from '../../../presentation/dto';

/**
 * Caso de uso atómico hexagonal para gestión de especialidades médicas propias.
 * Cumple con la directiva LEAN (<= 150 líneas).
 */
@Injectable()
export class ManagePractitionerSpecialtiesUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    private readonly ownership: ProfileOwnershipService,
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly specialtyCatalog: MedicalSpecialtyCatalogService,
  ) {
    this.logger.setContext(ManagePractitionerSpecialtiesUseCase.name);
  }

  async setOwnPrimarySpecialty(
    specialtyId: string,
    actor: AuthenticatedUser,
  ): Promise<SpecialtyResponseDto> {
    this.logger.info(
      { operation: 'profiles.specialty.setPrimary', specialtyId, actorId: actor.id },
      'Setting primary specialty',
    );
    return this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const specialty = await this.specialtiesRepo.findById(tx, specialtyId);
      if (!specialty || specialty.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Especialidad no encontrada', { specialtyId });
      }

      if (specialty.validTo) {
        throw new PreconditionFailedException(
          'Una especialidad que ya no ejerce no puede ser la principal',
          { specialtyId, validTo: specialty.validTo },
        );
      }

      if (specialty.isPrimary !== true) {
        const now = new Date();
        await this.specialtiesRepo.demotePrimary(tx, profileId, now);
        specialty.isPrimary = true;
        touch(specialty, actor.id);
        await tx.flush();
      }

      return {
        id: specialty.id,
        specialtyConceptId: specialty.specialtyConceptId,
        isPrimary: specialty.isPrimary ?? false,
        verificationStatus: specialty.verificationStatusConceptId,
        createdAt: specialty.createdAt,
      };
    });
  }

  async updateOwnSpecialty(
    specialtyId: string,
    dto: UpdateOwnSpecialtyDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const specialty = await this.specialtiesRepo.findByIdForUpdate(tx, specialtyId);
      if (!specialty || specialty.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Especialidad no encontrada', { specialtyId });
      }
      this.assertSpecialtyEditable(specialty, 'corregir');

      if (
        dto.specialtyConceptId !== undefined &&
        dto.specialtyConceptId !== specialty.specialtyConceptId
      ) {
        await this.specialtyCatalog.assertIsMedicalSpecialty(tx, dto.specialtyConceptId);
        const duplicate = await this.specialtiesRepo.findActive(tx, profileId, dto.specialtyConceptId);
        if (duplicate) {
          throw new ConflictException(
            'El profesional ya tiene esa especialidad activa',
            { specialtyConceptId: dto.specialtyConceptId },
          );
        }
        specialty.specialtyConceptId = dto.specialtyConceptId;
      }
      if (dto.boardCertified !== undefined) {
        specialty.boardCertified = dto.boardCertified;
      }
      touch(specialty, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.specialty.updateOwn', specialtyId, actorId: actor.id },
        'Own specialty updated',
      );
    });
  }

  async removeOwnSpecialty(
    specialtyId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const specialty = await this.specialtiesRepo.findByIdForUpdate(tx, specialtyId);
      if (!specialty || specialty.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Especialidad no encontrada', { specialtyId });
      }
      this.assertSpecialtyEditable(specialty, 'retirar');

      this.specialtiesRepo.remove(tx, specialty);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.specialty.removeOwn', specialtyId, actorId: actor.id },
        'Own specialty removed',
      );
    });
  }

  private assertSpecialtyEditable(
    specialty: { id: string; verificationStatusConceptId: string; validTo?: Date | null },
    verb: 'corregir' | 'retirar',
  ): void {
    if (
      specialty.verificationStatusConceptId !== PROF.SPEC_VERIF_PENDING ||
      specialty.validTo
    ) {
      throw new PreconditionFailedException(
        `Esa especialidad ya no está pendiente de verificación; no se puede ${verb}`,
        {
          specialtyId: specialty.id,
          verificationStatusConceptId: specialty.verificationStatusConceptId,
        },
      );
    }
  }
}
