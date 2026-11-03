import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE } from '../../../common/constants/legal-entity-types';
import { REPRESENTATIVE_ROLE_CODE } from '../../../common/constants/legal-representatives';
import { DIR } from '../directory.concepts';
import {
  DOCUMENT_TYPE_CODE_BY_ROLE,
  type AffiliationDocumentRole,
} from '../affiliation-documents';
import {
  DirectoryTenantLegalRepository,
  TenantsRepository,
} from '../repositories';
import type {
  CompleteAffiliationDocumentsDto,
  CompleteAffiliationDocumentsResponseDto,
  LaboratoryReadinessResponseDto,
  PharmacyReadinessResponseDto,
} from '../dto';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';
import {
  PharmacyOperatingRequirementsService,
  type OperatingKind,
} from './pharmacy-operating-requirements.service';
import { TenantAdministrationService } from './tenant-administration.service';
import { TenantAffiliationDocumentsService } from './tenant-affiliation-documents.service';

/** Campo del cuerpo → rol canónico, en el orden en que se persisten. */
const FIELD_BY_ROLE: Readonly<
  Record<AffiliationDocumentRole, keyof CompleteAffiliationDocumentsDto>
> = {
  CONSTITUTION_DOC: 'constitutionFileId',
  TAX_IDENTIFIER_DOC: 'taxIdentifierFileId',
  COMMERCE_REGISTRY_DOC: 'commerceRegistryFileId',
  OPERATING_LICENSE_DOC: 'operatingLicenseFileId',
  HEALTH_AUTHORITY_CERT_DOC: 'healthAuthorityCertificateFileId',
  POWER_OF_ATTORNEY_DOC: 'powerOfAttorneyFileId',
};

/** Roles de plataforma que pueden completar o leer papeles de cualquier organización. */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

/** Código del tipo societario (`SRL`, `UNIPERSONAL`…) a partir de su concepto. */
function legalEntityTypeCodeOf(
  conceptId: string | undefined,
): string | undefined {
  if (!conceptId) return undefined;
  return Object.entries(LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE).find(
    ([, id]) => id === conceptId,
  )?.[0];
}

/**
 * Completar después del alta los papeles que el alta pública dejó opcionales,
 * y leer qué le falta a una farmacia para operar (P50).
 *
 * Sin esta puerta, la regla «una farmacia no opera sin sus seis papeles»
 * (`PharmacyOperatingRequirementsService`) dejaba sin salida a toda farmacia
 * que se registró sin ellos —lo que D2 permite—: el alta era el único lugar
 * donde se podían declarar.
 */
@Injectable()
export class TenantDocumentCompletionService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param tenantsRepo - Tenants.
   * @param legalRepo - Representantes legales del tenant.
   * @param tenantAdmin - Quién administra o lee la organización.
   * @param concepts - Catálogos de documentos y roles de representación.
   * @param documents - Reclamo y alta de cada documento.
   * @param requirements - Qué está presentado y qué falta para operar.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tenantsRepo: TenantsRepository,
    private readonly legalRepo: DirectoryTenantLegalRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly concepts: AffiliationDocumentConceptsService,
    private readonly documents: TenantAffiliationDocumentsService,
    private readonly requirements: PharmacyOperatingRequirementsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantDocumentCompletionService.name);
  }

  /**
   * Vincula los papeles declarados al tenant, pendientes de verificación.
   *
   * Sólo owner o admin de esa organización (o la plataforma), y sólo mientras
   * la organización está pendiente de verificación: después, cambiar un papel
   * ya verificado es un trámite distinto (reemplazo con revisión), no esto.
   *
   * @param tenantId - Organización.
   * @param dto - Los `fileId` a vincular, por rol.
   * @param actor - Quien sube.
   * @returns Cuántos y cuáles quedaron registrados.
   * @throws ForbiddenException si el actor no la administra (exista o no).
   * @throws ResourceNotFoundException si el tenant no existe y el actor es plataforma.
   * @throws PreconditionFailedException sin documentos, fuera de PENDING, con
   *   un archivo repetido o con un poder sin representante legal.
   * @throws ConflictException si un papel de ese tipo ya está presentado.
   */
  async complete(
    tenantId: string,
    dto: CompleteAffiliationDocumentsDto,
    actor: AuthenticatedUser,
  ): Promise<CompleteAffiliationDocumentsResponseDto> {
    const declared = (
      Object.entries(FIELD_BY_ROLE) as [
        AffiliationDocumentRole,
        keyof CompleteAffiliationDocumentsDto,
      ][]
    )
      .map(([role, field]) => ({ role, fileId: dto[field] }))
      .filter(
        (entry): entry is { role: AffiliationDocumentRole; fileId: string } =>
          entry.fileId !== undefined,
      );
    if (declared.length === 0) {
      throw new PreconditionFailedException(
        'Declare al menos un documento para vincular',
      );
    }
    const fileIds = declared.map((entry) => entry.fileId);
    if (new Set(fileIds).size !== fileIds.length) {
      throw new PreconditionFailedException(
        'Un mismo archivo no puede respaldar dos documentos distintos',
      );
    }

    this.logger.info(
      {
        operation: 'directory.affiliation-documents.complete',
        tenantId,
        roles: declared.map((entry) => entry.role),
      },
      'Completing affiliation documents',
    );

    return this.em.transactional(async (tx) => {
      // Autorizar ANTES de buscar el tenant: quien no puede administrarlo
      // recibe 403 exista o no, así el 404 no revela qué ids existen.
      await this.assertAuthorized(tx, tenantId, actor, 'administer');
      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      if (!tenant) {
        throw new ResourceNotFoundException('Organización no encontrada', {
          tenantId,
        });
      }
      if (tenant.statusConceptId !== DIR.TENANT_PENDING) {
        throw new PreconditionFailedException(
          'Los papeles se completan mientras la organización está pendiente de verificación',
          { tenantId },
        );
      }

      const concepts = await this.concepts.resolve(tx);
      const live = await this.requirements.liveDocumentsByType(tx, tenantId);
      for (const { role } of declared) {
        const typeConceptId = concepts.documentType.get(
          DOCUMENT_TYPE_CODE_BY_ROLE[role].toUpperCase(),
        );
        if (typeConceptId !== undefined && live.has(typeConceptId)) {
          throw new ConflictException(
            'Ese documento ya está presentado y pendiente de verificación',
            { role },
          );
        }
      }

      const legalEntityType = legalEntityTypeCodeOf(
        tenant.legalEntityTypeConceptId,
      );
      const documentIds: string[] = [];
      for (const { role, fileId } of declared) {
        if (role === 'POWER_OF_ATTORNEY_DOC') continue;
        documentIds.push(
          await this.documents.attachDocument(tx, role, {
            tenantId,
            ownerUserId: actor.id,
            legalEntityType,
            fileId,
            documentNumber:
              role === 'TAX_IDENTIFIER_DOC' ? dto.taxIdentifier : undefined,
          }),
        );
      }

      if (dto.powerOfAttorneyFileId !== undefined) {
        documentIds.push(
          await this.attachPowerOfAttorney(
            tx,
            tenantId,
            actor,
            legalEntityType,
            dto.powerOfAttorneyFileId,
            fileIds,
          ),
        );
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'directory.affiliation-documents.complete',
          tenantId,
          registered: documentIds.length,
        },
        'Affiliation documents completed',
      );
      return { registered: documentIds.length, documentIds };
    });
  }

  /**
   * Lo que le falta a una farmacia para que la plataforma pueda verificarla.
   *
   * Lectura: alcanza con pertenecer a la organización (o ser plataforma).
   *
   * @param tenantId - Organización de tipo farmacia.
   * @param actor - Quien consulta.
   * @returns `{ ready, missing }`.
   * @throws ResourceNotFoundException si el tenant no existe.
   * @throws ForbiddenException si el actor no pertenece a la organización.
   * @throws PreconditionFailedException si la organización no es una farmacia.
   */
  async pharmacyReadiness(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyReadinessResponseDto> {
    return this.readiness(tenantId, actor, 'PHARMACY');
  }

  /**
   * P51: lo que le falta a un laboratorio para que la plataforma pueda
   * verificarlo (matrícula del SEPREC, licencia de funcionamiento y
   * certificado del SEDES). 422 si la organización no es un laboratorio
   * (un `DIAGNOSTIC_CENTER` sin unidad de laboratorio clínico tampoco lo es).
   *
   * @param tenantId - Organización.
   * @param actor - Quien consulta: miembro de la organización o plataforma.
   * @returns Si puede operar y qué falta.
   */
  async laboratoryReadiness(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<LaboratoryReadinessResponseDto> {
    return this.readiness(tenantId, actor, 'LABORATORY');
  }

  /** Lectura común de los requisitos para operar, por clase de organización. */
  private async readiness(
    tenantId: string,
    actor: AuthenticatedUser,
    kind: OperatingKind,
  ): Promise<{ ready: boolean; missing: string[] }> {
    const em = this.em.fork();
    await this.assertAuthorized(em, tenantId, actor, 'read');
    const tenant = await this.tenantsRepo.findById(em, tenantId);
    if (!tenant) {
      throw new ResourceNotFoundException('Organización no encontrada', {
        tenantId,
      });
    }
    if ((await this.requirements.kindOf(em, tenant)) !== kind) {
      throw new PreconditionFailedException(
        kind === 'PHARMACY'
          ? 'La organización no es una farmacia'
          : 'La organización no es un laboratorio',
        { tenantId },
      );
    }
    const readiness = await this.requirements.evaluate(em, tenant, kind);
    return { ready: readiness.ready, missing: [...readiness.missing] };
  }

  /**
   * Autoriza por rol de plataforma **con su ámbito** o por membresía.
   *
   * No usa `TenantAdministrationService.assertCanAdminister`/`assertCanRead`:
   * su atajo de plataforma mira `actor.roles` sin `scopedRoles`, y un
   * `SECURITY_ADMIN` acotado a otra organización pasaría. Acá el rol se
   * evalúa con `roleAuthorizesInTenant` (la regla del `RolesGuard`) y la
   * membresía sin atajo, como `PracticeSitesService.assertCanReadPractices`.
   *
   * @throws ForbiddenException si no cumple ni por rol ni por membresía.
   */
  private async assertAuthorized(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    mode: 'administer' | 'read',
  ): Promise<void> {
    const byRole = PLATFORM_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (byRole) return;
    const byMembership =
      mode === 'administer'
        ? await this.tenantAdmin.administersByMembership(em, tenantId, actor)
        : await this.tenantAdmin.belongsByMembership(em, tenantId, actor);
    if (byMembership) return;
    throw new ForbiddenException(
      mode === 'administer'
        ? 'Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma'
        : 'Se requiere pertenecer a la organización, o ser administrador de la plataforma',
    );
  }

  /**
   * Vincula el poder al representante legal que el alta declaró.
   *
   * El poder acredita a una persona: sin representante legal no hay a quién
   * atarlo, y declarar uno nuevo es un trámite aparte (crea una persona).
   */
  private async attachPowerOfAttorney(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    legalEntityType: string | undefined,
    fileId: string,
    declaredFileIds: readonly string[],
  ): Promise<string> {
    const concepts = await this.concepts.resolve(tx);
    const legalRoleConceptId = concepts.representativeRole.get(
      REPRESENTATIVE_ROLE_CODE.LEGAL_REPRESENTATIVE,
    );
    const representative = (
      await this.legalRepo.listLegalRepsByTenant(tx, tenantId)
    ).find(
      (rep) =>
        rep.representativeRoleConceptId === legalRoleConceptId &&
        rep.statusConceptId === CONCEPTS.STATE_ACTIVE,
    );
    if (!representative) {
      throw new PreconditionFailedException(
        'La organización no tiene representante legal al que atar el poder',
        { role: 'POWER_OF_ATTORNEY_DOC' },
      );
    }
    const documentId = await this.documents.attachPowerOfAttorney(tx, {
      tenantId,
      ownerUserId: actor.id,
      legalEntityType,
      fileId,
      relatedPersonId: representative.personId,
      alreadyDeclaredFileIds: declaredFileIds.filter((id) => id !== fileId),
    });
    representative.powerOfAttorneyDocumentId = documentId;
    touch(representative, actor.id);
    return documentId;
  }
}
