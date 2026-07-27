import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DiagnosticUnitsRepository,
  DiagnosticUnitSitesRepository,
  DiagnosticUnitSpecialtiesRepository,
  DiagnosticUnitAccreditationsRepository,
  DiagnosticUnitPractitionerAssignmentsRepository,
} from '../repositories';
import {
  AccreditationResponseDto,
  AddSiteDto,
  AssignmentResponseDto,
  CreateAccreditationDto,
  CreateDiagnosticUnitDto,
  CreatePractitionerAssignmentDto,
  DiagnosticUnitResponseDto,
  RenewAccreditationDto,
  ReprojectResultDto,
  SetSpecialtiesDto,
  SiteResponseDto,
  SpecialtiesResultDto,
  UpdateSiteDto,
} from '../dto';
import { DUNIT } from '../diagnostic_units.concepts';
import type { DiagnosticUnits } from '../entities';

/**
 * Casos de uso de ciclo de vida de la unidad diagnóstica: alta con sitios y
 * acreditaciones (UC-23-01), gestión de sitios (UC-23-02), verificación y
 * publicación (UC-23-03), especialidades (UC-23-04), asignación de especialistas
 * (UC-23-10), acreditaciones (UC-23-11) y reproyección del perfil público
 * (UC-23-12).
 *
 * El servicio posee la unidad de trabajo: usa `em.transactional` y hace `flush`
 * del padre antes de crear hijos (las FK son columnas uuid, MikroORM no ordena
 * inserts entre entidades no relacionadas).
 */
@Injectable()
export class DiagnosticUnitsService {
  constructor(
    private readonly em: EntityManager,
    private readonly unitsRepo: DiagnosticUnitsRepository,
    private readonly sitesRepo: DiagnosticUnitSitesRepository,
    private readonly specialtiesRepo: DiagnosticUnitSpecialtiesRepository,
    private readonly accreditationsRepo: DiagnosticUnitAccreditationsRepository,
    private readonly assignmentsRepo: DiagnosticUnitPractitionerAssignmentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticUnitsService.name);
  }

  /** UC-23-01: alta de unidad con sus sitios (1..N) y acreditaciones (0..N). */
  async create(
    dto: CreateDiagnosticUnitDto,
    actor: AuthenticatedUser,
  ): Promise<DiagnosticUnitResponseDto> {
    this.logger.info(
      {
        operation: 'diagnostic_units.unit.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating diagnostic unit',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.unitsRepo.findByCode(tx, dto.tenantId, dto.code);
      if (clash) {
        this.logger.warn(
          { operation: 'diagnostic_units.unit.create', reason: 'code-in-use' },
          'Rejected: code already used in tenant',
        );
        throw new ConflictException('El código ya existe en el tenant', {
          code: dto.code,
        });
      }

      const unit = this.unitsRepo.create(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        diagnosticUnitTypeConceptId:
          dto.diagnosticUnitTypeConceptId ?? DUNIT.UNIT_TYPE_LABORATORY,
        ownershipTypeConceptId:
          dto.ownershipTypeConceptId ?? DUNIT.OWNERSHIP_PRIVATE,
        practiceId: dto.practiceId,
        primaryPracticeSiteId: dto.primaryPracticeSiteId,
        acceptsExternalOrders: dto.acceptsExternalOrders,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el padre antes de los hijos.
      await tx.flush();

      const sites = dto.sites ?? [];
      for (const s of sites) {
        this.sitesRepo.create(tx, {
          diagnosticUnitId: unit.id,
          practiceSiteId: s.practiceSiteId,
          siteRoleConceptId: s.siteRoleConceptId,
          accessionPrefix: s.accessionPrefix,
          sampleCollectionAvailable: s.sampleCollectionAvailable,
          imagingAvailable: s.imagingAvailable,
          actorUserId: actor.id,
        });
      }

      const accreditations = dto.accreditations ?? [];
      for (const a of accreditations) {
        this.accreditationsRepo.create(tx, {
          diagnosticUnitId: unit.id,
          accreditationConceptId: a.accreditationConceptId,
          accreditationNumber: a.accreditationNumber,
          issuerTenantId: a.issuerTenantId,
          evidenceFileId: a.evidenceFileId,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        { operation: 'diagnostic_units.unit.create', unitId: unit.id },
        'Diagnostic unit created',
      );
      return this.toUnitResponse(unit, sites.length, accreditations.length);
    });
  }

  /** UC-23-02: registrar un sitio operativo adicional. */
  async addSite(
    unitId: string,
    dto: AddSiteDto,
    actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.site.add', unitId },
      'Adding site',
    );
    return this.em.transactional(async (tx) => {
      const unit = await this.loadActiveUnit(tx, unitId);

      const site = this.sitesRepo.create(tx, {
        diagnosticUnitId: unit.id,
        practiceSiteId: dto.practiceSiteId,
        siteRoleConceptId: dto.siteRoleConceptId,
        accessionPrefix: dto.accessionPrefix,
        sampleCollectionAvailable: dto.sampleCollectionAvailable,
        imagingAvailable: dto.imagingAvailable,
        actorUserId: actor.id,
      });

      touch(unit, actor.id);
      return {
        id: site.id,
        diagnosticUnitId: unit.id,
        status: site.statusConceptId,
      };
    });
  }

  /** UC-23-02: actualizar un sitio operativo existente. */
  async updateSite(
    siteId: string,
    dto: UpdateSiteDto,
    actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.site.update', siteId },
      'Updating site',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.sitesRepo.findById(tx, siteId);
      if (!site)
        throw new ResourceNotFoundException('Sitio no encontrado', { siteId });

      if (dto.siteRoleConceptId !== undefined)
        site.siteRoleConceptId = dto.siteRoleConceptId;
      if (dto.accessionPrefix !== undefined)
        site.accessionPrefix = dto.accessionPrefix;
      if (dto.sampleCollectionAvailable !== undefined) {
        site.sampleCollectionAvailable = dto.sampleCollectionAvailable;
      }
      if (dto.imagingAvailable !== undefined)
        site.imagingAvailable = dto.imagingAvailable;
      touch(site, actor.id);

      return {
        id: site.id,
        diagnosticUnitId: site.diagnosticUnitId,
        status: site.statusConceptId,
      };
    });
  }

  /** UC-23-03: verificar la unidad y publicar su perfil público. */
  async verifyAndPublish(
    unitId: string,
    actor: AuthenticatedUser,
  ): Promise<DiagnosticUnitResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.unit.verify', unitId },
      'Verifying unit',
    );
    return this.em.transactional(async (tx) => {
      const unit = await this.loadActiveUnit(tx, unitId);

      const activeSites = await this.sitesRepo.countActiveForUnit(tx, unit.id);
      if (activeSites < 1) {
        this.logger.warn(
          {
            operation: 'diagnostic_units.unit.verify',
            reason: 'no-active-site',
          },
          'Rejected: unit has no active site',
        );
        throw new PreconditionFailedException(
          'La unidad no tiene ningún sitio activo para publicar',
          { unitId },
        );
      }

      unit.verificationStatusConceptId = DUNIT.VERIFICATION_VERIFIED;
      if (!unit.publicProfileId) unit.publicProfileId = randomUUID();
      touch(unit, actor.id);

      await this.specialtiesRepo.verifyOpenForUnit(tx, unit.id);
      await this.accreditationsRepo.verifyOpenForUnit(tx, unit.id);

      this.logger.info(
        { operation: 'diagnostic_units.unit.verify', unitId: unit.id },
        'Unit verified and published',
      );
      return this.toUnitResponse(unit, 0, 0);
    });
  }

  /** UC-23-04: declarar el conjunto vigente de especialidades (PUT idempotente). */
  async setSpecialties(
    unitId: string,
    dto: SetSpecialtiesDto,
    actor: AuthenticatedUser,
  ): Promise<SpecialtiesResultDto> {
    this.logger.info(
      { operation: 'diagnostic_units.specialties.set', unitId },
      'Setting specialties',
    );

    const primaries = dto.specialties.filter((s) => s.isPrimary).length;
    if (primaries > 1) {
      throw new PreconditionFailedException(
        'A lo sumo una especialidad puede ser primaria',
        {
          unitId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const unit = await this.loadActiveUnit(tx, unitId);

      const open = await this.specialtiesRepo.findOpenForUnit(tx, unit.id);
      const desired = new Set(dto.specialties.map((s) => s.specialtyConceptId));

      let closed = 0;
      for (const existing of open) {
        if (!desired.has(existing.specialtyConceptId)) {
          existing.validTo = new Date();
          touch(existing, actor.id);
          closed += 1;
        }
      }

      for (const item of dto.specialties) {
        const current = await this.specialtiesRepo.findOpenByConcept(
          tx,
          unit.id,
          item.specialtyConceptId,
        );
        if (current) {
          current.isPrimary = item.isPrimary ?? false;
          touch(current, actor.id);
        } else {
          this.specialtiesRepo.create(tx, {
            diagnosticUnitId: unit.id,
            specialtyConceptId: item.specialtyConceptId,
            isPrimary: item.isPrimary,
            validFrom: new Date(),
            actorUserId: actor.id,
          });
        }
      }

      touch(unit, actor.id);
      return { active: dto.specialties.length, closed };
    });
  }

  /** UC-23-10: asignar un especialista a la unidad/sitio. */
  async assignPractitioner(
    unitId: string,
    dto: CreatePractitionerAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<AssignmentResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.assignment.create', unitId },
      'Assigning practitioner',
    );
    return this.em.transactional(async (tx) => {
      const unit = await this.loadActiveUnit(tx, unitId);

      const overlap = await this.assignmentsRepo.findActiveOverlap(
        tx,
        unit.id,
        dto.practitionerRoleAssignmentId,
        dto.diagnosticUnitSiteId,
      );
      if (overlap) {
        throw new ConflictException(
          'El profesional ya tiene una asignación activa en ese rol/sitio',
          { unitId },
        );
      }

      const assignment = this.assignmentsRepo.create(tx, {
        diagnosticUnitId: unit.id,
        practitionerRoleAssignmentId: dto.practitionerRoleAssignmentId,
        diagnosticUnitSiteId: dto.diagnosticUnitSiteId,
        specialtyConceptId: dto.specialtyConceptId,
        assignmentRoleConceptId: dto.assignmentRoleConceptId,
        mayValidateResults: dto.mayValidateResults,
        maySignReports: dto.maySignReports,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });

      // Si el especialista aporta una especialidad no declarada, se registra.
      if (dto.specialtyConceptId) {
        const existing = await this.specialtiesRepo.findOpenByConcept(
          tx,
          unit.id,
          dto.specialtyConceptId,
        );
        if (!existing) {
          this.specialtiesRepo.create(tx, {
            diagnosticUnitId: unit.id,
            specialtyConceptId: dto.specialtyConceptId,
            validFrom: new Date(),
            actorUserId: actor.id,
          });
        }
      }

      return { id: assignment.id, status: assignment.statusConceptId };
    });
  }

  /** UC-23-11: registrar una acreditación con evidencia. */
  async addAccreditation(
    unitId: string,
    dto: CreateAccreditationDto,
    actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.accreditation.add', unitId },
      'Adding accreditation',
    );
    return this.em.transactional(async (tx) => {
      const unit = await this.loadActiveUnit(tx, unitId);

      const acc = this.accreditationsRepo.create(tx, {
        diagnosticUnitId: unit.id,
        accreditationConceptId: dto.accreditationConceptId,
        diagnosticUnitSiteId: dto.diagnosticUnitSiteId,
        accreditationNumber: dto.accreditationNumber,
        issuerTenantId: dto.issuerTenantId,
        evidenceFileId: dto.evidenceFileId,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });

      return {
        id: acc.id,
        verificationStatus: acc.verificationStatusConceptId,
      };
    });
  }

  /** UC-23-11: renovar una acreditación: cierra la previa y crea la nueva VERIFIED. */
  async renewAccreditation(
    accreditationId: string,
    dto: RenewAccreditationDto,
    actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.accreditation.renew', accreditationId },
      'Renewing accreditation',
    );
    return this.em.transactional(async (tx) => {
      const previous = await this.accreditationsRepo.findById(
        tx,
        accreditationId,
      );
      if (!previous) {
        throw new ResourceNotFoundException('Acreditación no encontrada', {
          accreditationId,
        });
      }

      previous.validTo = dto.validFrom ?? new Date();
      touch(previous, actor.id);

      const renewed = this.accreditationsRepo.create(tx, {
        diagnosticUnitId: previous.diagnosticUnitId,
        accreditationConceptId: previous.accreditationConceptId,
        diagnosticUnitSiteId: previous.diagnosticUnitSiteId,
        accreditationNumber:
          dto.accreditationNumber ?? previous.accreditationNumber,
        issuerTenantId: previous.issuerTenantId,
        evidenceFileId: dto.evidenceFileId ?? previous.evidenceFileId,
        validFrom: dto.validFrom ?? new Date(),
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      renewed.verificationStatusConceptId = DUNIT.VERIFICATION_VERIFIED;

      return {
        id: renewed.id,
        verificationStatus: renewed.verificationStatusConceptId,
      };
    });
  }

  /** UC-23-12: reproyectar el perfil público (idempotente; solo si VERIFIED). */
  async reproject(
    unitId: string,
    actor: AuthenticatedUser,
  ): Promise<ReprojectResultDto> {
    this.logger.info(
      {
        operation: 'diagnostic_units.unit.reproject',
        unitId,
        actorId: actor.id,
      },
      'Reprojecting public profile',
    );
    const em = this.em.fork();
    const unit = await this.unitsRepo.findById(em, unitId);
    if (!unit)
      throw new ResourceNotFoundException('Unidad no encontrada', { unitId });

    const projected =
      unit.verificationStatusConceptId === DUNIT.VERIFICATION_VERIFIED &&
      Boolean(unit.publicProfileId);

    return { diagnosticUnitId: unit.id, projected };
  }

  /** Carga una unidad y valida que exista y esté ACTIVA (precondición común). */
  private async loadActiveUnit(
    tx: EntityManager,
    unitId: string,
  ): Promise<DiagnosticUnits> {
    const unit = await this.unitsRepo.findById(tx, unitId);
    if (!unit)
      throw new ResourceNotFoundException('Unidad no encontrada', { unitId });
    if (unit.statusConceptId !== DUNIT.UNIT_ACTIVE) {
      throw new PreconditionFailedException('La unidad no está activa', {
        unitId,
      });
    }
    return unit;
  }

  private toUnitResponse(
    unit: DiagnosticUnits,
    siteCount: number,
    accreditationCount: number,
  ): DiagnosticUnitResponseDto {
    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      verificationStatus: unit.verificationStatusConceptId,
      status: unit.statusConceptId,
      publicProfileId: unit.publicProfileId,
      siteCount,
      accreditationCount,
    };
  }
}
