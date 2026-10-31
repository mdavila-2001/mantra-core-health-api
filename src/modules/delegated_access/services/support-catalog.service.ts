import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException } from '@nestjs/common';
import { DELEG } from '../delegated_access.concepts';
import {
  EngagementRequestsRepository,
  SupportAccessRepository,
  SupportCatalogRepository,
} from '../repositories';
import { STATUS } from './concept-maps';
import type { CatalogPlacementDto, SupportCatalogResponseDto } from '../dto';
import { DelegationScopeService } from './delegation-scope.service';
import { withPersonScope } from './tenant-context';

/**
 * Catálogo de doctores, servicios y ubicaciones de una organización: lo que
 * se puede nombrar en un permiso de apoyo. La administración lo lee para su
 * editor de permisos; la persona de apoyo, para pedirlos.
 */
@Injectable()
export class SupportCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param catalog - Lecturas de estructura.
   * @param access - Vínculos de la persona.
   * @param requests - Solicitudes de la persona.
   * @param scope - Política común de tenant.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalog: SupportCatalogRepository,
    private readonly access: SupportAccessRepository,
    private readonly requests: EngagementRequestsRepository,
    private readonly scope: DelegationScopeService,
  ) {}

  /** Catálogo de la organización activa (administración). */
  forActiveTenant(): Promise<SupportCatalogResponseDto> {
    return this.build(this.scope.resolveTenant());
  }

  /**
   * Catálogo de una organización para quien la asiste o le pide un vínculo.
   * Solo lo lee quien tiene un vínculo ACTIVO o una solicitud PENDIENTE y
   * vigente en ella: crear una solicitud no abre la estructura de cualquier
   * organización para siempre, y una ajena responde 403. Recibe lo mínimo para
   * armar su pedido: no el perfil profesional de los doctores ni su sede interna.
   *
   * @param userId - Persona de apoyo.
   * @param tenantId - Organización.
   * @returns El catálogo.
   * @throws ForbiddenException si la persona no tiene relación vigente con la organización.
   */
  async forPerson(
    userId: string,
    tenantId: string,
  ): Promise<SupportCatalogResponseDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      // Lo que se verifica son filas de la propia persona (su vínculo y sus
      // solicitudes); la estructura de la organización se lee ya dentro de ella.
      const engaged = await scope.ownRows(async () => {
        const engagements = await this.access.findEngagements(tx, {
          userId,
          tenantId,
        });
        return engagements.some(
          (e) => e.assignment.statusConceptId === STATUS.ACTIVE,
        );
      });
      if (!engaged) {
        const pending = await scope.ownRows(async () => {
          const mine = await this.requests.findByRequester(tx, userId, 200);
          const now = Date.now();
          return mine.some(
            (r) =>
              r.tenantId === tenantId &&
              r.statusConceptId === DELEG.ENGAGEMENT_STATUS_PENDING &&
              r.expiresAt.getTime() > now,
          );
        });
        if (!pending) {
          throw new ForbiddenException(
            'No tiene relación vigente con esa organización',
          );
        }
      }
      const full = await scope.inTenant(tenantId, () =>
        this.build(tenantId, tx),
      );
      return {
        ...full,
        // Lo que el pedido necesita es la asignación del doctor, no su perfil
        // profesional ni la sede interna.
        doctors: full.doctors.map((doctor) => ({
          practitionerRoleAssignmentId: doctor.practitionerRoleAssignmentId,
          displayName: doctor.displayName,
          placements: doctor.placements,
        })),
      };
    });
  }

  /** Arma el catálogo cruzando asignaciones, espacios y servicios. */
  private async build(
    tenantId: string,
    reader?: EntityManager,
  ): Promise<SupportCatalogResponseDto> {
    const tx = reader ?? this.em.fork({ keepTransactionContext: true });
    const [doctors, services, locations] = await Promise.all([
      this.catalog.doctors(tx, tenantId),
      this.catalog.services(tx, tenantId),
      this.catalog.locations(tx, tenantId),
    ]);
    const placed = await this.catalog.locationAssignments(
      tx,
      doctors.map((d) => d.roleAssignmentId),
    );
    const spaceSite = new Map(
      locations
        .filter((l) => l.kind === 'SPACE')
        .map((l) => [l.id, l.practiceSiteId] as const),
    );
    return {
      tenantId,
      doctors: doctors.map((doctor) => {
        const spaces = placed
          .filter((p) => p.roleAssignmentId === doctor.roleAssignmentId)
          .map((p) => p.careSpaceId);
        const placements: CatalogPlacementDto[] = [];
        for (const careSpaceId of spaces) {
          // Servicio de la asignación; sin él, los de la sede del espacio.
          const candidates = doctor.healthcareServiceId
            ? [doctor.healthcareServiceId]
            : services
                .filter(
                  (s) =>
                    !s.practiceSiteId ||
                    s.practiceSiteId === spaceSite.get(careSpaceId),
                )
                .map((s) => s.id);
          if (candidates.length === 0) placements.push({ careSpaceId });
          for (const healthcareServiceId of candidates) {
            placements.push({ careSpaceId, healthcareServiceId });
          }
        }
        if (spaces.length === 0 && doctor.healthcareServiceId) {
          placements.push({ healthcareServiceId: doctor.healthcareServiceId });
        }
        return {
          practitionerRoleAssignmentId: doctor.roleAssignmentId,
          practitionerProfileId: doctor.practitionerProfileId,
          displayName: doctor.displayName,
          practiceSiteId: doctor.practiceSiteId,
          placements,
        };
      }),
      services,
      locations,
    };
  }
}
