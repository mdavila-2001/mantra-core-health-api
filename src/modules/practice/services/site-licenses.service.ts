import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { FacilityLicenses } from '../../organization_extensions/entities';
import { ORGEXT } from '../../organization_extensions/organization_extensions.concepts';
import {
  FacilityLicensesRepository,
  OrgextReferencesRepository,
} from '../../organization_extensions/repositories';
import { REGULATORY } from '../infrastructure-catalog';
import { PracticeErrorReason } from '../practice.error-reasons';
import { assertRowVersion, withVersionConflict } from '../http/row-version';
import { practiceOutOfScope, assertPracticeScope } from './practice-scope';
import { StructureContextService } from './structure-context.service';
import { mapReferenceViolation } from './structure-errors';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { isoDate } from './structure-mapper';
import { ClinicalUnitsRepository } from '../repositories';

/** Habilitación de un establecimiento (sobre `organization_extensions.facility_licenses`). */
export interface SiteLicenseView {
  readonly id: string;
  readonly practiceSiteId: string;
  readonly authorityName: string | null;
  readonly resolutionNumber: string;
  readonly issuedOn: string | null;
  readonly expiresOn: string | null;
  /** Estado `LIC_*` **efectivo**: una vigente con `expiresOn` pasado se lee `LIC_EXPIRED` (INV-21). */
  readonly status: { code: string; display: string };
  /** Estado tal como se guardó. */
  readonly storedStatus: { code: string; display: string };
  readonly clinicalUnitId: string | null;
  readonly healthcareServiceId: string | null;
  readonly documentFileId: string | null;
  readonly rowVersion: number;
}

/** Cuerpo de alta de una habilitación. */
export interface LicenseInput {
  authorityName?: string;
  resolutionNumber: string;
  issuedOn?: string;
  expiresOn?: string;
  /** `LIC_*`; por omisión `LIC_IN_PROCESS`. */
  status?: string;
  clinicalUnitId?: string;
  healthcareServiceId?: string;
  documentFileId?: string;
}

/** Cuerpo de `PATCH /site-licenses/:id`; `null` limpia fechas, alcance y documento. */
export interface LicensePatch {
  authorityName?: string | null;
  resolutionNumber?: string;
  issuedOn?: string | null;
  expiresOn?: string | null;
  status?: string;
  clinicalUnitId?: string | null;
  healthcareServiceId?: string | null;
  documentFileId?: string | null;
}

/** Vocabulario legado de `facility_licenses` → vocabulario `LIC_*` del contrato. */
const LEGACY_STATUS: Readonly<Record<string, string>> = {
  [ORGEXT.LICENSE_PENDING]: 'LIC_IN_PROCESS',
  [ORGEXT.LICENSE_VERIFIED]: 'LIC_VALID',
  [ORGEXT.LICENSE_REJECTED]: 'LIC_REVOKED',
};

/**
 * Habilitaciones del establecimiento (`procesos/03`, flujo B).
 *
 * Las lee y escribe sobre `organization_extensions.facility_licenses`, no sobre
 * `site_licenses`, que **no existe** (Desvíos del modelo v4.2.67b). Mapeo:
 * autoridad = `issuing_authority_name`, resolución = `license_number`, emisión =
 * `valid_from`, vencimiento = `valid_to`, estado = `verification_status_concept_id`,
 * documento = `evidence_file_id`. `notes` del contrato no tiene columna y no se
 * inventa una. No se borra una habilitación: se cambia su estado.
 */
@Injectable()
export class SiteLicensesService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param licensesRepo - Repositorio de habilitaciones.
   * @param references - Pertenencia de unidad, servicio y archivo al tenant.
   * @param unitsRepo - Unidades de la sede.
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly licensesRepo: FacilityLicensesRepository,
    private readonly references: OrgextReferencesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly events: StructureEventsService,
  ) {}

  /**
   * `GET /sites/:siteId/licenses`.
   *
   * @param siteId - Establecimiento.
   * @param actor - Quien lee.
   * @returns Las habilitaciones de la sede, la de vencimiento más lejano primero.
   */
  async list(
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<SiteLicenseView[]> {
    return this.em.transactional(async (tx) => {
      const { site, tenantId } = await this.context.site(
        tx,
        siteId,
        actor,
        'read',
      );
      const rows = await tx.find(
        FacilityLicenses,
        { tenantId, practiceSiteId: site.id },
        { orderBy: { validTo: 'DESC', createdAt: 'DESC' } },
      );
      return rows.map((row) => this.view(row));
    });
  }

  /**
   * `POST /sites/:siteId/licenses`.
   *
   * @param siteId - Establecimiento.
   * @param input - Datos de la habilitación.
   * @param actor - Quien la registra.
   * @param correlationId - Id de correlación.
   * @returns La habilitación creada.
   */
  async create(
    siteId: string,
    input: LicenseInput,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SiteLicenseView> {
    return this.em.transactional(async (tx) => {
      const { site, tenantId } = await this.context.site(
        tx,
        siteId,
        actor,
        'regulatory',
      );
      const status = this.statusId(input.status ?? 'LIC_IN_PROCESS');
      this.assertRange(input.issuedOn, input.expiresOn);
      await this.assertReferences(tx, site.id, tenantId, input);

      const licenseType = ORGEXT.LICENSE_TYPE_OPERATING;
      if (
        await this.licensesRepo.findByNumber(
          tx,
          tenantId,
          licenseType,
          input.resolutionNumber.trim(),
        )
      ) {
        throw new ConflictException(
          'Ya existe una habilitación con ese número de resolución',
          undefined,
          PracticeErrorReason.LICENSE_NUMBER_TAKEN,
        );
      }
      const license = this.licensesRepo.create(tx, {
        tenantId,
        practiceSiteId: site.id,
        facilityTypeConceptId: ORGEXT.FACILITY_TYPE_HOSPITAL,
        licenseTypeConceptId: licenseType,
        licenseNumber: input.resolutionNumber.trim(),
        issuingAuthorityName: input.authorityName?.trim() || undefined,
        validFrom: input.issuedOn ? new Date(input.issuedOn) : undefined,
        validTo: input.expiresOn ? new Date(input.expiresOn) : undefined,
        evidenceFileId: input.documentFileId,
        verificationStatusConceptId: status,
        actorUserId: actor.id,
      });
      license.clinicalUnitId = input.clinicalUnitId;
      license.healthcareServiceId = input.healthcareServiceId;
      await mapReferenceViolation(() => tx.flush());
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.licenseCreated,
        aggregateType: 'facility_license',
        aggregateId: license.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          licenseId: license.id,
          practiceSiteId: site.id,
          rowVersion: license.rowVersion,
        },
      });
      return this.view(license);
    });
  }

  /**
   * `PATCH /site-licenses/:id` con `If-Match`.
   *
   * @param licenseId - Habilitación.
   * @param patch - Campos a cambiar.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien edita.
   * @param correlationId - Id de correlación.
   * @returns La habilitación actualizada.
   */
  async update(
    licenseId: string,
    patch: LicensePatch,
    expectedVersion: number,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SiteLicenseView> {
    return this.em.transactional(async (tx) => {
      const activeTenant = requireTenantId();
      const found = await this.licensesRepo.findByIdInTenant(
        tx,
        licenseId,
        activeTenant,
      );
      const license = assertPracticeScope(
        found,
        found?.tenantId,
        activeTenant,
        'Habilitación no encontrada',
      );
      if (!license.practiceSiteId)
        throw practiceOutOfScope('Habilitación no encontrada');
      const { site, tenantId } = await this.context.site(
        tx,
        license.practiceSiteId,
        actor,
        'regulatory',
      );
      assertRowVersion(license.rowVersion, expectedVersion);

      const next = {
        issuedOn:
          patch.issuedOn === undefined
            ? isoDate(license.validFrom)
            : patch.issuedOn,
        expiresOn:
          patch.expiresOn === undefined
            ? isoDate(license.validTo)
            : patch.expiresOn,
      };
      this.assertRange(next.issuedOn ?? undefined, next.expiresOn ?? undefined);
      await this.assertReferences(tx, site.id, tenantId, {
        clinicalUnitId: patch.clinicalUnitId ?? undefined,
        healthcareServiceId: patch.healthcareServiceId ?? undefined,
        documentFileId: patch.documentFileId ?? undefined,
      });

      const changed: string[] = [];
      if (patch.authorityName !== undefined) {
        license.issuingAuthorityName = (patch.authorityName?.trim() ||
          null) as string;
        changed.push('authorityName');
      }
      if (
        patch.resolutionNumber !== undefined &&
        patch.resolutionNumber.trim() !== license.licenseNumber
      ) {
        const clash = await this.licensesRepo.findByNumber(
          tx,
          tenantId,
          license.licenseTypeConceptId,
          patch.resolutionNumber.trim(),
        );
        if (clash && clash.id !== license.id) {
          throw new ConflictException(
            'Ya existe una habilitación con ese número de resolución',
            undefined,
            PracticeErrorReason.LICENSE_NUMBER_TAKEN,
          );
        }
        license.licenseNumber = patch.resolutionNumber.trim();
        changed.push('resolutionNumber');
      }
      if (patch.issuedOn !== undefined) {
        license.validFrom = (
          patch.issuedOn ? new Date(patch.issuedOn) : null
        ) as Date;
        changed.push('issuedOn');
      }
      if (patch.expiresOn !== undefined) {
        license.validTo = (
          patch.expiresOn ? new Date(patch.expiresOn) : null
        ) as Date;
        changed.push('expiresOn');
      }
      if (patch.status !== undefined) {
        license.verificationStatusConceptId = this.statusId(patch.status);
        changed.push('status');
      }
      if (patch.clinicalUnitId !== undefined) {
        license.clinicalUnitId = (patch.clinicalUnitId ?? null) as string;
        changed.push('clinicalUnitId');
      }
      if (patch.healthcareServiceId !== undefined) {
        license.healthcareServiceId = (patch.healthcareServiceId ??
          null) as string;
        changed.push('healthcareServiceId');
      }
      if (patch.documentFileId !== undefined) {
        license.evidenceFileId = (patch.documentFileId ?? null) as string;
        changed.push('documentFileId');
      }
      if (changed.length === 0) return this.view(license);

      touch(license, actor.id);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.licenseUpdated,
        aggregateType: 'facility_license',
        aggregateId: license.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          licenseId: license.id,
          practiceSiteId: site.id,
          changedFields: changed,
          rowVersion: license.rowVersion,
        },
      });
      return this.view(license);
    });
  }

  /** Vista con el estado efectivo (INV-21): el vencimiento se calcula al leer. */
  view(license: FacilityLicenses, today: Date = new Date()): SiteLicenseView {
    const storedCode =
      LEGACY_STATUS[license.verificationStatusConceptId] ??
      REGULATORY.licenseStatus.byConceptId(license.verificationStatusConceptId)
        ?.code ??
      'LIC_IN_PROCESS';
    const expiresOn = isoDate(license.validTo);
    const expired =
      storedCode === 'LIC_VALID' &&
      expiresOn !== null &&
      expiresOn < today.toISOString().slice(0, 10);
    const effective = REGULATORY.licenseStatus.byInput(
      expired ? 'LIC_EXPIRED' : storedCode,
    )!;
    const stored = REGULATORY.licenseStatus.byInput(storedCode)!;
    return {
      id: license.id,
      practiceSiteId: license.practiceSiteId!,
      authorityName: license.issuingAuthorityName ?? null,
      resolutionNumber: license.licenseNumber,
      issuedOn: isoDate(license.validFrom),
      expiresOn,
      status: { code: effective.code, display: effective.display },
      storedStatus: { code: stored.code, display: stored.display },
      clinicalUnitId: license.clinicalUnitId ?? null,
      healthcareServiceId: license.healthcareServiceId ?? null,
      documentFileId: license.evidenceFileId ?? null,
      rowVersion: license.rowVersion,
    };
  }

  private statusId(code: string): string {
    const entry = REGULATORY.licenseStatus.byInput(code);
    if (!entry) {
      throw new PreconditionFailedException(
        `Estado de habilitación desconocido: ${code}`,
        {
          errors: [
            {
              field: 'status',
              reason: PracticeErrorReason.CATALOG_CODE_INVALID,
            },
          ],
        },
        PracticeErrorReason.CATALOG_CODE_INVALID,
      );
    }
    return entry.id;
  }

  private assertRange(
    issuedOn: string | undefined,
    expiresOn: string | undefined,
  ): void {
    if (issuedOn && expiresOn && expiresOn < issuedOn) {
      throw new PreconditionFailedException(
        'El vencimiento es anterior a la emisión',
        {
          errors: [
            {
              field: 'expiresOn',
              reason: PracticeErrorReason.VALIDITY_RANGE_INVALID,
            },
          ],
        },
        PracticeErrorReason.VALIDITY_RANGE_INVALID,
      );
    }
  }

  /** Unidad de la sede y servicio y archivo del tenant: lo ajeno responde 404 uniforme. */
  private async assertReferences(
    tx: EntityManager,
    siteId: string,
    tenantId: string,
    refs: Pick<
      LicenseInput,
      'clinicalUnitId' | 'healthcareServiceId' | 'documentFileId'
    >,
  ): Promise<void> {
    if (refs.clinicalUnitId) {
      const unit = await this.unitsRepo.findById(tx, refs.clinicalUnitId);
      if (!unit || unit.tenantId !== tenantId)
        throw practiceOutOfScope('Unidad no encontrada');
      if (unit.practiceSiteId !== siteId) {
        throw new PreconditionFailedException(
          'La unidad es de otro establecimiento',
          undefined,
          PracticeErrorReason.UNIT_SITE_MISMATCH,
        );
      }
    }
    if (
      refs.healthcareServiceId &&
      !(await this.references.healthcareServiceInTenants(
        tx,
        refs.healthcareServiceId,
        [tenantId],
      ))
    ) {
      throw practiceOutOfScope('Servicio no encontrado');
    }
    if (
      refs.documentFileId &&
      !(await this.references.fileInTenants(tx, refs.documentFileId, [
        tenantId,
      ]))
    ) {
      throw practiceOutOfScope('Archivo no encontrado');
    }
  }
}
