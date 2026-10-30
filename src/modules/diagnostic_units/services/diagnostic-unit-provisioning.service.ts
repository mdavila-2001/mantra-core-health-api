import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import { adminDivisionLineage } from '../../../common/seed/admin-divisions.catalog';
import { AddressesRepository } from '../../common/repositories';
import { PRAC } from '../../practice/practice.concepts';
import {
  PracticesRepository,
  PracticeSitesRepository,
} from '../../practice/repositories';
import { siteCodeBase, uniqueCode } from '../../practice/site-code';
import type { OwnSiteAddressDto } from '../../practice/dto';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  findDiagnosticUnitModality,
  resolveDiagnosticUnitType,
} from '../diagnostic-unit-modalities';
import {
  DiagnosticUnitsRepository,
  DiagnosticUnitSitesRepository,
  DiagnosticStudyOfferingsRepository,
} from '../repositories';

/**
 * A quién pertenece la unidad que se va a provisionar.
 *
 * Igual que {@link https://... OwnSiteOwner} de P20: el tenant en el que
 * nace la unidad y la cuenta que queda como administradora de su práctica.
 */
export interface DiagnosticUnitOwner {
  readonly tenantId: string;
  /**
   * Código de la organización; base del código de la unidad si no se
   * declara otro. Opcional: algunas puertas de alta no lo tienen a mano en
   * este punto de la transacción.
   */
  readonly tenantCode?: string;
  /** Razón social; base del nombre de la unidad si no se declara otro. */
  readonly legalName: string;
  readonly ownerUserId: string;
}

/**
 * Datos del centro de diagnóstico declarados en el alta.
 *
 * Estructuralmente idéntico a `DiagnosticUnitProfileDto`
 * (`directory/dto/tenant-type-profile.dto.ts`) para que ese DTO se pase acá
 * sin conversión, pero **sin importarlo**: este módulo no depende de
 * `directory`, la dependencia va en el sentido contrario
 * (`DirectoryModule` importa `DiagnosticUnitsModule`).
 */
export interface DiagnosticUnitProvisioningProfile {
  readonly code?: string;
  readonly name?: string;
  readonly diagnosticUnitTypeConceptId?: string;
  readonly modalityConceptIds?: readonly string[];
  readonly walkInAvailable?: boolean;
  readonly homeCollectionAvailable?: boolean;
  readonly primarySite?: {
    readonly name?: string;
    readonly timeZone?: string;
    readonly address?: OwnSiteAddressDto;
  };
  /** Sucursales de un laboratorio; cada una es una sede más de la unidad. */
  readonly branches?: readonly {
    readonly name: string;
    readonly address?: OwnSiteAddressDto;
  }[];
}

/** Lo que dejó escrito {@link DiagnosticUnitProvisioningService.provision}. */
export interface ProvisionedDiagnosticUnit {
  readonly unitId: string;
  readonly practiceId: string;
  readonly siteId: string;
  readonly addressId?: string;
  readonly offeringIds: readonly string[];
  /** `practice_sites.id` de cada sucursal, en el orden declarado. */
  readonly branchSiteIds: readonly string[];
}

/**
 * Alta de la unidad diagnóstica inicial de un centro de imagenología o
 * laboratorio (subtarea 1.5, PR #404 del front): práctica propia, sede
 * primaria (dirección opcional), la unidad y su sede de unidad, más una
 * oferta de estudio genérica por cada modalidad declarada.
 *
 * Mismo patrón que `OwnSiteProvisioningService` (P20): recibe el tenant, la
 * cuenta dueña y los datos ya validados, **no abre transacción propia**
 * —escribe en la que el llamador ya tiene abierta— y no valida nada: la
 * pertenencia de tipo y modalidades a sus listas cerradas la comprobó
 * `TenantTypeProfileService.assertProfileMatchesType` antes de llegar acá.
 *
 * `diagnostic_unit_sites.practice_site_id` es una FK NOT NULL a
 * `practice.practice_sites`: una unidad diagnóstica no puede existir sin al
 * menos una sede de práctica de la que colgar, así que este servicio SIEMPRE
 * crea la cadena completa (práctica → sede → unidad → sede de unidad), con
 * "Sede central" y sin dirección cuando el cliente no declaró `primarySite`.
 */
@Injectable()
export class DiagnosticUnitProvisioningService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param practicesRepo - Prácticas, para la práctica propia de la unidad.
   * @param sitesRepo - Sedes de práctica.
   * @param addressesRepo - Direcciones de la sede primaria.
   * @param unitsRepo - Unidades diagnósticas.
   * @param unitSitesRepo - Sedes de la unidad diagnóstica.
   * @param offeringsRepo - Ofertas de estudio, una por modalidad declarada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly unitsRepo: DiagnosticUnitsRepository,
    private readonly unitSitesRepo: DiagnosticUnitSitesRepository,
    private readonly offeringsRepo: DiagnosticStudyOfferingsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticUnitProvisioningService.name);
  }

  /**
   * Da de alta la unidad diagnóstica dentro de `tx`.
   *
   * @param tx - Transacción activa del llamador. No se abre ninguna acá.
   * @param owner - Tenant y cuenta dueña, ya persistidos.
   * @param profile - Datos declarados de la unidad (código, nombre, tipo,
   *   modalidades, sede primaria). Todos opcionales: sin nada, la unidad
   *   nace con los valores por defecto y sin modalidades.
   * @param actorUserId - Quién queda como autor de las filas nuevas.
   * @returns Los identificadores de lo creado.
   */
  async provision(
    tx: EntityManager,
    owner: DiagnosticUnitOwner,
    profile: DiagnosticUnitProvisioningProfile,
    actorUserId: string,
  ): Promise<ProvisionedDiagnosticUnit> {
    const unitCode =
      profile.code ??
      owner.tenantCode ??
      siteCodeBase(owner.legalName, 'UNIDAD');
    const unitName = profile.name ?? owner.legalName;
    const unitTypeConceptId = resolveDiagnosticUnitType(profile);
    const isLaboratory = unitTypeConceptId === DUNIT.UNIT_TYPE_LABORATORY;

    // 1) La práctica propia de la unidad: nace ACTIVA con el owner de la
    // organización como administrador (no hay nadie más presente en el alta
    // a quien pedirle permiso, mismo criterio que el consultorio propio de
    // P20).
    const practice = this.practicesRepo.create(tx, {
      tenantId: owner.tenantId,
      code: unitCode,
      name: unitName,
      typeConceptId: PRAC.PRACTICE_TYPE_DIAGNOSTIC_CENTER,
      adminUserId: owner.ownerUserId,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
      actorUserId,
    });
    await tx.flush();

    // 2) y 3) Dirección opcional y sede primaria de la práctica.
    const { site, addressId } = await this.createPracticeSite(
      tx,
      owner,
      practice.id,
      {
        name: profile.primarySite?.name ?? 'Sede central',
        timeZone: profile.primarySite?.timeZone,
        address: profile.primarySite?.address,
      },
      actorUserId,
    );

    // 4) La unidad diagnóstica en sí, colgada de la práctica y su sede.
    const unit = this.unitsRepo.create(tx, {
      tenantId: owner.tenantId,
      code: unitCode,
      name: unitName,
      diagnosticUnitTypeConceptId: unitTypeConceptId,
      ownershipTypeConceptId: DUNIT.OWNERSHIP_PRIVATE,
      practiceId: practice.id,
      primaryPracticeSiteId: site.id,
      acceptsExternalOrders: true,
      walkInAvailable: profile.walkInAvailable ?? true,
      homeCollectionAvailable: profile.homeCollectionAvailable ?? false,
      actorUserId,
    });
    await tx.flush();

    // 5) La sede de la unidad: PRIMARY, disponible para imágenes o toma de
    // muestras según el tipo declarado.
    const unitSite = this.unitSitesRepo.create(tx, {
      diagnosticUnitId: unit.id,
      practiceSiteId: site.id,
      siteRoleConceptId: DUNIT.SITE_ROLE_PRIMARY,
      imagingAvailable: isLaboratory ? undefined : true,
      sampleCollectionAvailable: isLaboratory ? true : undefined,
      actorUserId,
    });
    await tx.flush();

    // 5b) Las sucursales declaradas: cada una es otra sede de la misma
    // práctica y de la misma unidad. Solo laboratorios (el tenant-type-profile
    // lo valida): su rol es el de punto de toma de muestras.
    const branchSiteIds: string[] = [];
    for (const branch of profile.branches ?? []) {
      const { site: branchSite } = await this.createPracticeSite(
        tx,
        owner,
        practice.id,
        { name: branch.name, address: branch.address },
        actorUserId,
      );
      this.unitSitesRepo.create(tx, {
        diagnosticUnitId: unit.id,
        practiceSiteId: branchSite.id,
        siteRoleConceptId: DUNIT.SITE_ROLE_COLLECTION,
        sampleCollectionAvailable: true,
        actorUserId,
      });
      await tx.flush();
      branchSiteIds.push(branchSite.id);
    }

    // 6) Una oferta de estudio genérica por cada modalidad declarada: es de
    // ahí de donde el directorio público deriva hoy las modalidades que
    // expone una unidad.
    const offeringIds: string[] = [];
    for (const conceptId of profile.modalityConceptIds ?? []) {
      const modality = findDiagnosticUnitModality(conceptId);
      if (!modality) continue;
      const offering = this.offeringsRepo.create(tx, {
        diagnosticUnitId: unit.id,
        diagnosticUnitSiteId: unitSite.id,
        studyCode: modality.studyCode,
        studyConceptId: DUNIT.STUDY_GENERIC,
        modalityConceptId: modality.conceptId,
        displayName: modality.displayName,
        actorUserId,
      });
      offeringIds.push(offering.id);
    }
    if (offeringIds.length > 0) await tx.flush();

    this.logger.info(
      {
        operation: 'diagnostic_units.provisioning.provision',
        unitId: unit.id,
        modalities: offeringIds.length,
      },
      'Diagnostic unit provisioned',
    );

    return {
      unitId: unit.id,
      practiceId: practice.id,
      siteId: site.id,
      addressId,
      offeringIds,
      branchSiteIds,
    };
  }

  /**
   * Crea la dirección opcional y la sede de práctica que cuelga de ella.
   *
   * Una línea en blanco no es «sin dirección», es una fila vacía; si no queda
   * nada tras recortar, la columna se deja sin valor en vez de guardar `''`.
   * Sirve a la sede primaria y a cada sucursal: es el mismo caso.
   */
  private async createPracticeSite(
    tx: EntityManager,
    owner: DiagnosticUnitOwner,
    practiceId: string,
    declared: {
      readonly name: string;
      readonly timeZone?: string;
      readonly address?: OwnSiteAddressDto;
    },
    actorUserId: string,
  ): Promise<{ site: { id: string }; addressId?: string }> {
    let addressId: string | undefined;
    const declaredAddress = declared.address;
    if (declaredAddress) {
      const lines = declaredAddress.lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const address = this.addressesRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_USER,
        ownerId: owner.ownerUserId,
        lines: lines.length > 0 ? lines.join('\n') : undefined,
        city: declaredAddress.city,
        municipalityConceptId: declaredAddress.municipalityConceptId,
        administrativeAreaConceptId:
          declaredAddress.administrativeAreaConceptId,
        // ADR-0028: la provincia sale del municipio y el distrito viaja aparte
        // de las líneas, igual que en el consultorio propio.
        administrativeArea2ConceptId: declaredAddress.municipalityConceptId
          ? adminDivisionLineage(declaredAddress.municipalityConceptId)
              ?.level2ConceptId
          : undefined,
        districtText: declaredAddress.district?.trim() || undefined,
        countryConceptId: CONCEPTS.COUNTRY_BO,
        useConceptId: CONCEPTS.ADDR_USE_WORK,
        typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
        latitude:
          declaredAddress.latitude !== undefined
            ? String(declaredAddress.latitude)
            : undefined,
        longitude:
          declaredAddress.longitude !== undefined
            ? String(declaredAddress.longitude)
            : undefined,
        actorUserId,
      });
      await tx.flush();
      addressId = address.id;
    }

    const siteCode = await uniqueCode(
      siteCodeBase(declared.name, 'SEDE'),
      async (candidate) =>
        (await this.sitesRepo.findByPracticeAndCode(
          tx,
          practiceId,
          candidate,
        )) !== null,
    );
    const site = this.sitesRepo.create(tx, {
      practiceId,
      code: siteCode,
      name: declared.name,
      siteTypeConceptId: PRAC.SITE_TYPE_OFFICE,
      operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
      timeZone: declared.timeZone,
      addressId,
      managingTenantId: owner.tenantId,
      // F1: la sede pertenece al tenant de su práctica (NOT NULL desde v4.2.67).
      tenantId: owner.tenantId,
      statusConceptId: PRAC.SITE_ACTIVE,
      actorUserId,
    });
    await tx.flush();
    return { site, addressId };
  }
}
