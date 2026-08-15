import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  AddMaterialAssetDto,
  ChangeProductStatusDto,
  CreateInformationalMaterialDto,
  CreatePharmaProductDto,
  CreatedResourceDto,
  DecideMaterialDto,
  TransitionResultDto,
  UpdatePharmaProductDto,
} from '../dto';
import type {
  InformationalMaterials,
  MaterialApprovals,
  MaterialAssets,
  PharmaProducts,
} from '../entities';
import { CatalogRepository } from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';

/** Estados en los que un producto puede difundirse a profesionales. */
const PUBLISHABLE_STATUSES = [PHL.PRODUCT_APPROVED, PHL.PRODUCT_MARKETED];

/**
 * Transiciones admitidas del estado regulatorio de un medicamento
 * (spec 5441-5448).
 *
 * Un producto no vuelve de «retirado» a «comercializado» por un `PATCH`: para
 * eso hay que registrarlo de nuevo con su registro sanitario. Que la lista sea
 * explícita es lo que hace que ese camino no exista por descuido.
 */
const PRODUCT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  [PHL.PRODUCT_RESEARCH]: [PHL.PRODUCT_DEVELOPMENT, PHL.PRODUCT_WITHDRAWN],
  [PHL.PRODUCT_DEVELOPMENT]: [PHL.PRODUCT_EVALUATION, PHL.PRODUCT_WITHDRAWN],
  [PHL.PRODUCT_EVALUATION]: [PHL.PRODUCT_APPROVED, PHL.PRODUCT_WITHDRAWN],
  [PHL.PRODUCT_APPROVED]: [
    PHL.PRODUCT_MARKETED,
    PHL.PRODUCT_SUSPENDED,
    PHL.PRODUCT_WITHDRAWN,
  ],
  [PHL.PRODUCT_MARKETED]: [PHL.PRODUCT_SUSPENDED, PHL.PRODUCT_WITHDRAWN],
  [PHL.PRODUCT_SUSPENDED]: [PHL.PRODUCT_MARKETED, PHL.PRODUCT_WITHDRAWN],
  [PHL.PRODUCT_WITHDRAWN]: [],
};

/**
 * UC-17-21 a UC-17-26: catálogo de medicamentos y material informativo
 * (spec 5423-5481).
 *
 * Las dos reglas duras del carril viven acá: **no publicar indicaciones no
 * aprobadas** (5450) y **no compartir material no aprobado** (5480). Ninguna se
 * resuelve con una advertencia en la interfaz: la primera bloquea el guardado de
 * la indicación mientras el producto no esté aprobado, y la segunda impide que
 * el material salga de `MATERIAL_DRAFT` sin una decisión de revisión registrada.
 */
@Injectable()
export class PharmaCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio del catálogo.
   * @param access - Comprobaciones de vinculación y estado.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogRepository,
    private readonly access: PharmaLabAccessService,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmaCatalogService.name);
  }

  /**
   * UC-17-21: registra un medicamento.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador del producto creado.
   * @throws PreconditionFailedException si se declara una indicación en un
   *   producto que todavía no está aprobado.
   */
  async createProduct(
    pharmaLabId: string,
    dto: CreatePharmaProductDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      this.assertIndicationAllowed(
        dto.authorizedIndication,
        dto.regulatoryStatusConceptId,
      );

      const product = this.repo.createProduct(tx, {
        pharmaLabId,
        tradeName: dto.tradeName,
        activeIngredient: dto.activeIngredient,
        presentation: dto.presentation,
        concentration: dto.concentration,
        pharmaceuticalForm: dto.pharmaceuticalForm,
        administrationRoute: dto.administrationRoute,
        authorizedIndication: dto.authorizedIndication,
        manufacturerName: dto.manufacturerName,
        regulatoryStatusConceptId: dto.regulatoryStatusConceptId,
        sanitaryRegistryNumber: dto.sanitaryRegistryNumber,
        approvedOn: dto.approvedOn,
        registryExpiresOn: dto.registryExpiresOn,
        authorizedCountries: dto.authorizedCountries,
        disclosureLevelConceptId: dto.disclosureLevelConceptId,
        versionNo: 1,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_PRODUCT_CREATED',
        entity: 'pharma_products',
        entityId: product.id,
        tenantId: lab.tenantId,
      });
      return { id: product.id };
    });
  }

  /**
   * UC-17-22: actualiza un medicamento y sube su número de versión.
   *
   * @param pharmaLabId - Laboratorio.
   * @param productId - Producto.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado regulatorio resultante.
   */
  async updateProduct(
    pharmaLabId: string,
    productId: string,
    dto: UpdatePharmaProductDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const product = await this.requireProduct(tx, pharmaLabId, productId);
      if (dto.authorizedIndication !== undefined) {
        this.assertIndicationAllowed(
          dto.authorizedIndication,
          product.regulatoryStatusConceptId,
        );
        product.authorizedIndication = dto.authorizedIndication;
      }
      if (dto.presentation !== undefined)
        product.presentation = dto.presentation;
      if (dto.concentration !== undefined) {
        product.concentration = dto.concentration;
      }
      if (dto.sanitaryRegistryNumber !== undefined) {
        product.sanitaryRegistryNumber = dto.sanitaryRegistryNumber;
      }
      if (dto.registryExpiresOn !== undefined) {
        product.registryExpiresOn = dto.registryExpiresOn;
      }
      if (dto.authorizedCountries !== undefined) {
        product.authorizedCountries = dto.authorizedCountries;
      }
      if (dto.disclosureLevelConceptId !== undefined) {
        product.disclosureLevelConceptId = dto.disclosureLevelConceptId;
      }
      product.versionNo += 1;
      touch(product, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_PRODUCT_UPDATED',
        entity: 'pharma_products',
        entityId: product.id,
        tenantId: lab.tenantId,
      });
      return {
        id: product.id,
        statusConceptId: product.regulatoryStatusConceptId,
      };
    });
  }

  /**
   * UC-17-23: cambia el estado regulatorio de un medicamento.
   *
   * @param pharmaLabId - Laboratorio.
   * @param productId - Producto.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si la transición no está permitida.
   */
  async changeProductStatus(
    pharmaLabId: string,
    productId: string,
    dto: ChangeProductStatusDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const product = await this.requireProduct(tx, pharmaLabId, productId);
      const allowed =
        PRODUCT_TRANSITIONS[product.regulatoryStatusConceptId] ?? [];
      if (!allowed.includes(dto.regulatoryStatusConceptId)) {
        throw new ConflictException(
          'La transición de estado regulatorio no está permitida',
          { productId, current: product.regulatoryStatusConceptId },
        );
      }

      product.regulatoryStatusConceptId = dto.regulatoryStatusConceptId;
      // Un producto que deja de estar aprobado no puede seguir difundiendo su
      // indicación: se retira junto con el estado.
      if (!PUBLISHABLE_STATUSES.includes(dto.regulatoryStatusConceptId)) {
        product.authorizedIndication = undefined;
      }
      product.versionNo += 1;
      touch(product, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_PRODUCT_STATUS_CHANGED',
        entity: 'pharma_products',
        entityId: product.id,
        tenantId: lab.tenantId,
      });
      this.logger.info(
        {
          operation: 'pharma_lab.product.status',
          productId,
          status: dto.regulatoryStatusConceptId,
          reason: dto.reason,
        },
        'Product regulatory status changed',
      );
      return {
        id: product.id,
        statusConceptId: product.regulatoryStatusConceptId,
      };
    });
  }

  /**
   * Lista el catálogo del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Productos ordenados por nombre comercial.
   */
  async listProducts(pharmaLabId: string): Promise<PharmaProducts[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listProducts(this.em, pharmaLabId);
  }

  /**
   * UC-17-24: crea material informativo, siempre en borrador.
   *
   * Nace en `MATERIAL_DRAFT` sin excepción: la spec exige revisión interna, y un
   * endpoint que permitiera crear material ya aprobado convertiría esa revisión
   * en opcional.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador del material creado.
   */
  async createMaterial(
    pharmaLabId: string,
    dto: CreateInformationalMaterialDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      if (dto.pharmaProductId) {
        await this.requireProduct(tx, pharmaLabId, dto.pharmaProductId);
      }

      const material = this.repo.createMaterial(tx, {
        pharmaLabId,
        pharmaProductId: dto.pharmaProductId,
        campaignCode: dto.campaignCode,
        specialtyConceptId: dto.specialtyConceptId,
        medicalVisitorId: dto.medicalVisitorId,
        title: dto.title,
        kindConceptId: dto.kindConceptId,
        version: dto.version,
        authorName: dto.authorName,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        statusConceptId: PHL.MATERIAL_DRAFT,
        disclosureLevelConceptId: dto.disclosureLevelConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'INFORMATIONAL_MATERIAL_CREATED',
        entity: 'informational_materials',
        entityId: material.id,
        tenantId: lab.tenantId,
      });
      return { id: material.id };
    });
  }

  /**
   * UC-17-25: añade un adjunto al material.
   *
   * @param pharmaLabId - Laboratorio.
   * @param materialId - Material.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador del adjunto.
   * @throws PreconditionFailedException si el material ya está aprobado.
   */
  async addAsset(
    pharmaLabId: string,
    materialId: string,
    dto: AddMaterialAssetDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      await this.access.requireLab(tx, pharmaLabId);
      const material = await this.requireMaterial(tx, pharmaLabId, materialId);
      if (material.statusConceptId === PHL.MATERIAL_APPROVED) {
        throw new PreconditionFailedException(
          'No se puede modificar el contenido de un material ya aprobado; creá una versión nueva',
          { materialId },
        );
      }
      const asset = this.repo.createAsset(tx, {
        informationalMaterialId: material.id,
        kindConceptId: dto.kindConceptId,
        fileName: dto.fileName,
        storageKey: dto.storageKey,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: asset.id };
    });
  }

  /**
   * Envía un material a revisión interna.
   *
   * @param pharmaLabId - Laboratorio.
   * @param materialId - Material.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si el material no está en borrador.
   */
  async submitMaterialForReview(
    pharmaLabId: string,
    materialId: string,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const material = await this.requireMaterial(tx, pharmaLabId, materialId);
      if (material.statusConceptId !== PHL.MATERIAL_DRAFT) {
        throw new ConflictException(
          'Solo se envía a revisión un material en borrador',
          { materialId },
        );
      }
      const assets = await this.repo.listAssets(tx, material.id);
      if (assets.length === 0) {
        throw new PreconditionFailedException(
          'El material no tiene ningún adjunto que revisar',
          { materialId },
        );
      }
      material.statusConceptId = PHL.MATERIAL_IN_REVIEW;
      touch(material, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'INFORMATIONAL_MATERIAL_SUBMITTED',
        entity: 'informational_materials',
        entityId: material.id,
        tenantId: lab.tenantId,
      });
      return { id: material.id, statusConceptId: material.statusConceptId };
    });
  }

  /**
   * UC-17-26: decide la revisión interna de un material.
   *
   * @param pharmaLabId - Laboratorio.
   * @param materialId - Material.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si el material no está en revisión.
   */
  async decideMaterial(
    pharmaLabId: string,
    materialId: string,
    dto: DecideMaterialDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const material = await this.requireMaterial(tx, pharmaLabId, materialId);
      if (material.statusConceptId !== PHL.MATERIAL_IN_REVIEW) {
        throw new ConflictException(
          'Solo se decide sobre un material en revisión',
          { materialId },
        );
      }
      if (
        dto.decisionConceptId !== PHL.MATERIAL_APPROVED &&
        dto.decisionConceptId !== PHL.MATERIAL_REJECTED
      ) {
        throw new PreconditionFailedException(
          'La decisión debe ser aprobar o rechazar',
          { materialId },
        );
      }

      material.statusConceptId = dto.decisionConceptId;
      material.approverStaffId =
        dto.reviewerStaffId ?? material.approverStaffId;
      material.approvedAt =
        dto.decisionConceptId === PHL.MATERIAL_APPROVED
          ? new Date()
          : undefined;
      touch(material, actor.id);

      this.repo.createApproval(tx, {
        informationalMaterialId: material.id,
        materialVersion: material.version,
        decisionConceptId: dto.decisionConceptId,
        reviewerStaffId: dto.reviewerStaffId,
        rationale: dto.rationale,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action:
          dto.decisionConceptId === PHL.MATERIAL_APPROVED
            ? 'INFORMATIONAL_MATERIAL_APPROVED'
            : 'INFORMATIONAL_MATERIAL_REJECTED',
        entity: 'informational_materials',
        entityId: material.id,
        tenantId: lab.tenantId,
      });
      return { id: material.id, statusConceptId: material.statusConceptId };
    });
  }

  /**
   * Lista el material informativo del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Materiales del más reciente al más antiguo.
   */
  async listMaterials(pharmaLabId: string): Promise<InformationalMaterials[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listMaterials(this.em, pharmaLabId);
  }

  /**
   * Lista los adjuntos de un material.
   *
   * @param pharmaLabId - Laboratorio.
   * @param materialId - Material.
   * @returns Adjuntos del material.
   */
  async listAssets(
    pharmaLabId: string,
    materialId: string,
  ): Promise<MaterialAssets[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    await this.requireMaterial(this.em, pharmaLabId, materialId);
    return this.repo.listAssets(this.em, materialId);
  }

  /**
   * Lista el historial de revisiones de un material.
   *
   * @param pharmaLabId - Laboratorio.
   * @param materialId - Material.
   * @returns Decisiones de la más reciente a la más antigua.
   */
  async listApprovals(
    pharmaLabId: string,
    materialId: string,
  ): Promise<MaterialApprovals[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    await this.requireMaterial(this.em, pharmaLabId, materialId);
    return this.repo.listApprovals(this.em, materialId);
  }

  private assertIndicationAllowed(
    indication: string | undefined,
    statusConceptId: string,
  ): void {
    if (!indication) return;
    if (!PUBLISHABLE_STATUSES.includes(statusConceptId)) {
      throw new PreconditionFailedException(
        'No se puede declarar una indicación autorizada en un producto que no está aprobado',
        { statusConceptId },
      );
    }
  }

  private async requireProduct(
    tx: EntityManager,
    pharmaLabId: string,
    productId: string,
  ): Promise<PharmaProducts> {
    const product = await this.repo.findProduct(tx, productId);
    if (!product || product.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Producto no encontrado en el catálogo del laboratorio',
        { pharmaLabId, productId },
      );
    }
    return product;
  }

  private async requireMaterial(
    tx: EntityManager,
    pharmaLabId: string,
    materialId: string,
  ): Promise<InformationalMaterials> {
    const material = await this.repo.findMaterial(tx, materialId);
    if (!material || material.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Material informativo no encontrado en el laboratorio',
        { pharmaLabId, materialId },
      );
    }
    return material;
  }
}
