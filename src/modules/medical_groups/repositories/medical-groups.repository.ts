import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { MedicalGroups, type MedicalGroupStatus } from '../entities';

/** Datos para crear la fila `medical_groups.groups`. */
export interface CreateMedicalGroupData {
  tenantId: string;
  practiceId: string;
  serviceCatalogId: string;
  requestingPractitionerId: string;
  patientProfileId?: string;
  conditionId?: string;
  scheduledAt: Date;
  locationText: string;
  notesText?: string;
  termsText: string;
  status: MedicalGroupStatus;
  actorUserId?: string;
}

/** Acceso a datos de `medical_groups.groups`. */
@Injectable()
export class MedicalGroupsRepository {
  findById(em: EntityManager, id: string): Promise<MedicalGroups | null> {
    return em.findOne(MedicalGroups, { id });
  }

  create(em: EntityManager, data: CreateMedicalGroupData): MedicalGroups {
    return em.create(
      MedicalGroups,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        serviceCatalogId: data.serviceCatalogId,
        requestingPractitionerId: data.requestingPractitionerId,
        patientProfileId: data.patientProfileId,
        conditionId: data.conditionId,
        scheduledAt: data.scheduledAt,
        locationText: data.locationText,
        notesText: data.notesText,
        termsText: data.termsText,
        status: data.status,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Una página de grupos por id, más recientes primero. La composición de
   * "cuáles ids" (histórico/enviadas/recibidas) vive en el servicio, sobre
   * `MedicalGroupMembersRepository` — este repositorio no declara relaciones
   * ORM entre las dos tablas, igual que el resto del modelo (las FK son
   * columnas UUID simples, nunca `@OneToMany`/`@ManyToOne`).
   */
  findByIdsPage(
    em: EntityManager,
    ids: readonly string[],
    limit: number,
    afterCreatedAt?: Date,
  ): Promise<MedicalGroups[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    const where: Record<string, unknown> = { id: { $in: ids as string[] } };
    if (afterCreatedAt) {
      where.createdAt = { $lt: afterCreatedAt };
    }
    return em.find(MedicalGroups, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
    });
  }

  /** Ids de los grupos que este profesional creó. */
  findIdsByRequester(
    em: EntityManager,
    requestingPractitionerId: string,
  ): Promise<string[]> {
    return em
      .find(MedicalGroups, { requestingPractitionerId }, { fields: ['id'] })
      .then((rows) => rows.map((row) => row.id));
  }

  save(em: EntityManager): Promise<void> {
    return em.flush();
  }
}
