import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  OrganizationAffiliationsRepository,
  OrganizationDataBoundariesRepository,
  OrgextReferencesRepository,
} from '../repositories';
import {
  CreateAffiliationDto,
  AffiliationResponseDto,
  StatusResultDto,
} from '../dto';
import { hasPrivilegedTenantRole } from '../../../common/tenant/tenant-resolution';
import { ORGEXT } from '../organization_extensions.concepts';
import {
  ORGEXT_NOT_AVAILABLE,
  orgextNotAvailable,
  requireOrgextResource,
  resolveOwnerTenantId,
} from '../organization_extensions.tenant-scope';

/**
 * Casos de uso de afiliaciones entre organizaciones: declaración (UC-22-07, que
 * incluye la verificación de una frontera de datos del tenant participante) y
 * terminación con revocación de accesos derivados (UC-22-09).
 *
 * La revocación de grants de authz es cross-módulo (authz.clinical_access_grants
 * / resource_scope_grants): aquí se registra la intención en el log y se marca la
 * afiliación como terminada; el worker de proyección propaga la revocación.
 */
@Injectable()
export class OrgextAffiliationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param affiliationsRepo - Valor de affiliations repo requerido por la operación.
   * @param boundariesRepo - Valor de boundaries repo requerido por la operación.
   * @param references - Pertenencia de la sede, el servicio y el acuerdo de uso de datos del cuerpo.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly affiliationsRepo: OrganizationAffiliationsRepository,
    private readonly boundariesRepo: OrganizationDataBoundariesRepository,
    private readonly references: OrgextReferencesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrgextAffiliationsService.name);
  }

  /** UC-22-07: declara una afiliación activa entre dos tenants distintos. */
  async declare(
    dto: CreateAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    // El lado primario es siempre el tenant activo; el participante sólo se
    // acepta si el actor tiene alcance autorizado sobre él (o es de plataforma).
    const primaryTenantId = resolveOwnerTenantId(dto.primaryTenantId);
    this.assertActorScopesParticipant(dto.participatingTenantId, actor);
    this.logger.info(
      {
        operation: 'orgext.affiliation.declare',
        primaryTenantId,
        participatingTenantId: dto.participatingTenantId,
      },
      'Declaring organization affiliation',
    );
    return this.em.transactional(async (tx) => {
      if (primaryTenantId === dto.participatingTenantId) {
        throw new PreconditionFailedException(
          'El tenant primario y el participante deben ser distintos',
          { tenantId: primaryTenantId },
        );
      }

      // Sede anfitriona, servicio y acuerdo de uso de datos: de alguna de las
      // dos partes de la afiliación, nunca de un tercero.
      const parties = [primaryTenantId, dto.participatingTenantId];
      if (
        dto.hostPracticeSiteId &&
        !(await this.references.practiceSiteInTenants(
          tx,
          dto.hostPracticeSiteId,
          parties,
        ))
      ) {
        throw orgextNotAvailable();
      }
      if (
        dto.healthcareServiceId &&
        !(await this.references.healthcareServiceInTenants(
          tx,
          dto.healthcareServiceId,
          parties,
        ))
      ) {
        throw orgextNotAvailable();
      }
      if (
        dto.dataUseAgreementId &&
        !(await this.references.dataUseAgreementInTenants(
          tx,
          dto.dataUseAgreementId,
          parties,
        ))
      ) {
        throw orgextNotAvailable();
      }

      // <<include>> UC-22-08: debe existir una frontera de datos para el participante.
      const boundaries = await this.boundariesRepo.countActiveForTenant(
        tx,
        dto.participatingTenantId,
        ORGEXT.BOUNDARY_ACTIVE,
      );
      if (boundaries === 0) {
        this.logger.warn(
          {
            operation: 'orgext.affiliation.declare',
            reason: 'no-data-boundary',
          },
          'Rejected affiliation: participating tenant has no active data boundary',
        );
        throw new PreconditionFailedException(
          'El tenant participante no tiene una frontera de datos activa',
          { participatingTenantId: dto.participatingTenantId },
        );
      }

      const affiliationTypeConceptId =
        dto.affiliationTypeConceptId ?? ORGEXT.AFFILIATION_TYPE_REFERRAL;
      const duplicate = await this.affiliationsRepo.findActiveDuplicate(
        tx,
        primaryTenantId,
        dto.participatingTenantId,
        affiliationTypeConceptId,
        ORGEXT.AFFILIATION_ACTIVE,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una afiliación activa de ese tipo',
          {
            primaryTenantId,
            participatingTenantId: dto.participatingTenantId,
          },
        );
      }

      const affiliation = this.affiliationsRepo.create(tx, {
        primaryTenantId,
        participatingTenantId: dto.participatingTenantId,
        affiliationTypeConceptId,
        hostPracticeSiteId: dto.hostPracticeSiteId,
        healthcareServiceId: dto.healthcareServiceId,
        contractReference: dto.contractReference,
        dataUseAgreementId: dto.dataUseAgreementId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'orgext.affiliation.declare',
          affiliationId: affiliation.id,
        },
        'Affiliation declared',
      );
      return this.toResponse(affiliation);
    });
  }

  /** UC-22-09: termina una afiliación activa y revoca accesos derivados. */
  async terminate(
    affiliationId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'orgext.affiliation.terminate', affiliationId },
      'Terminating organization affiliation',
    );
    return this.em.transactional(async (tx) => {
      // Sólo una de las dos partes puede terminar la afiliación: para cualquier
      // otro tenant la afiliación no existe.
      const found = await this.affiliationsRepo.findByIdForParty(
        tx,
        affiliationId,
        tenantId,
      );
      const partyTenantId =
        found?.primaryTenantId === tenantId ||
        found?.participatingTenantId === tenantId
          ? tenantId
          : undefined;
      const affiliation = requireOrgextResource(found, partyTenantId, tenantId);

      if (affiliation.statusConceptId !== ORGEXT.AFFILIATION_ACTIVE) {
        throw new PreconditionFailedException('La afiliación no está activa', {
          affiliationId,
        });
      }

      affiliation.statusConceptId = ORGEXT.AFFILIATION_TERMINATED;
      affiliation.validTo = new Date();
      touch(affiliation, actor.id);

      // Revocación de grants derivados (cross-módulo authz) — propagada por outbox.
      this.logger.info(
        {
          operation: 'orgext.affiliation.terminate',
          affiliationId,
          revokeGrants: true,
        },
        'Affiliation terminated; derived access grants revocation requested',
      );
      return { ok: true, status: affiliation.statusConceptId };
    });
  }

  /**
   * Exige que el actor tenga alcance autorizado sobre el tenant participante:
   * es miembro de él o es un actor de plataforma (`SUPERADMIN`/`SYSTEM`). Que
   * el participante exista o no es indistinguible del caso sin alcance.
   *
   * @param participatingTenantId - Tenant contraparte declarado en el cuerpo.
   * @param actor - Sujeto autenticado.
   * @throws ResourceNotFoundException si el actor no tiene alcance sobre él.
   */
  private assertActorScopesParticipant(
    participatingTenantId: string,
    actor: AuthenticatedUser,
  ): void {
    if (hasPrivilegedTenantRole(actor)) return;
    if (actor.tenantIds?.includes(participatingTenantId)) return;
    throw new ResourceNotFoundException(
      ORGEXT_NOT_AVAILABLE.message,
      undefined,
      ORGEXT_NOT_AVAILABLE.reason,
    );
  }

  /**
   * Transforma to response.
   *
   * @param affiliation - Valor de affiliation requerido por la operación.
   * @returns Resultado de to response conforme al contrato `AffiliationResponseDto`.
   */
  private toResponse(affiliation: {
    /**
     * Identificador único de la instancia.
     */
    id: string;
    /**
     * Identificador asociado a primary tenant.
     */
    primaryTenantId: string;
    /**
     * Identificador asociado a participating tenant.
     */
    participatingTenantId: string;
    /**
     * Identificador asociado a status concept.
     */
    statusConceptId: string;
    /**
     * Fecha y hora en que se creó el registro.
     */
    createdAt: Date;
  }): AffiliationResponseDto {
    return {
      id: affiliation.id,
      primaryTenantId: affiliation.primaryTenantId,
      participatingTenantId: affiliation.participatingTenantId,
      status: affiliation.statusConceptId,
      createdAt: affiliation.createdAt,
    };
  }
}
