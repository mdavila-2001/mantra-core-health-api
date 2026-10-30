import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import { AddressesRepository } from '../../common/repositories';
import { PRAC } from '../../practice/practice.concepts';
import {
  PracticesRepository,
  PracticeSitesRepository,
} from '../../practice/repositories';
import { siteCodeBase } from '../../practice/site-code';
import { PHARM } from '../pharmacy.concepts';
import { PharmaciesRepository, PharmacySitesRepository } from '../repositories';
import { PharmacyCategoriesService } from './pharmacy-categories.service';

/** A quién pertenece la farmacia que se va a provisionar. */
export interface PharmacyOwner {
  readonly tenantId: string;
  /** Código de la organización: es también el de la farmacia y su práctica. */
  readonly code: string;
  readonly legalName: string;
  readonly tradeName?: string;
  /** Cuenta que queda como administradora de la práctica de la farmacia. */
  readonly ownerUserId: string;
  /** Zona horaria IANA declarada por la organización. */
  readonly timeZone?: string;
}

/** Un sitio físico declarado en el alta: la central o una sucursal. */
export interface PharmacyProvisioningSite {
  readonly name: string;
  /** Dirección escrita; vacía o ausente, la sede queda sin líneas. */
  readonly addressLines?: string;
  /** Ambas coordenadas o ninguna (el DTO ya lo garantiza). */
  readonly latitude?: number;
  readonly longitude?: number;
}

/** Lo que el alta declara de la farmacia: la central siempre, sucursales si hay. */
export interface PharmacyProvisioningProfile {
  readonly headquarters: PharmacyProvisioningSite;
  readonly branches?: readonly PharmacyProvisioningSite[];
}

/** Lo que dejó escrito {@link PharmacyProvisioningService.provision}. */
export interface ProvisionedPharmacy {
  readonly pharmacyId: string;
  readonly practiceId: string;
  /** `practice.practice_sites.id` de la casa central. */
  readonly headquartersPracticeSiteId: string;
  /** `pharmacy.pharmacy_sites.id` de la casa central. */
  readonly headquartersPharmacySiteId: string;
  /** `pharmacy.pharmacy_sites.id` de cada sucursal, en el orden declarado. */
  readonly branchPharmacySiteIds: readonly string[];
}

/**
 * Alta de la farmacia con su casa central y sus sucursales (P50).
 *
 * Mismo patrón que `DiagnosticUnitProvisioningService` (P51): recibe el
 * tenant y los datos ya validados, **no abre transacción propia** —escribe en
 * la que el alta ya tiene abierta— y no valida reglas de negocio.
 *
 * `pharmacy_sites.practice_site_id` es una FK NOT NULL a
 * `practice.practice_sites`: una sede dispensadora necesita la sede física de
 * la que cuelga, y es en la sede dispensadora donde vive el inventario
 * (`pharmacy_inventory.inventory_locations`). Por eso este servicio crea la
 * cadena completa —práctica propia → sede de práctica → sede de farmacia—
 * para la central y para cada sucursal, y enlaza la central en
 * `pharmacies.primary_practice_site_id`. Sin esto la farmacia nacía sin
 * ninguna sede donde guardar stock y sin saber cuál era su central.
 *
 * La farmacia nace en borrador y sin verificar; sus sedes nacen ACTIVAS, pero
 * no se ven ni operan mientras la farmacia no esté activa (la vitrina y el
 * alta de sedes exigen `PHARMACY_ACTIVE`).
 */
@Injectable()
export class PharmacyProvisioningService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param pharmaciesRepo - Farmacias.
   * @param pharmacySitesRepo - Sedes dispensadoras.
   * @param practicesRepo - Prácticas, para la práctica propia de la farmacia.
   * @param practiceSitesRepo - Sedes de práctica (sitios físicos).
   * @param addressesRepo - Direcciones de cada sitio.
   * @param categories - Las categorías por defecto del catálogo (P47).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly pharmacySitesRepo: PharmacySitesRepository,
    private readonly practicesRepo: PracticesRepository,
    private readonly practiceSitesRepo: PracticeSitesRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly categories: PharmacyCategoriesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyProvisioningService.name);
  }

  /**
   * Da de alta la farmacia dentro de `tx`.
   *
   * @param tx - Transacción activa del llamador. No se abre ninguna acá.
   * @param owner - Tenant y cuenta dueña, ya persistidos.
   * @param profile - Central y sucursales declaradas.
   * @param actorUserId - Quién queda como autor de las filas nuevas.
   * @returns Los identificadores de lo creado.
   */
  async provision(
    tx: EntityManager,
    owner: PharmacyOwner,
    profile: PharmacyProvisioningProfile,
    actorUserId: string,
  ): Promise<ProvisionedPharmacy> {
    // 1) La farmacia, en borrador: la activa la verificación de la plataforma,
    // y sólo si están los papeles (`PharmacyOperatingRequirementsService`).
    const pharmacy = this.pharmaciesRepo.create(tx, {
      tenantId: owner.tenantId,
      code: owner.code,
      legalName: owner.legalName,
      tradeName: owner.tradeName,
      pharmacyTypeConceptId: PHARM.PHARMACY_TYPE_RETAIL,
      ownershipTypeConceptId: PHARM.OWNERSHIP_PRIVATE,
      defaultCurrencyConceptId: PHARM.CURRENCY_USD,
      verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      statusConceptId: PHARM.PHARMACY_DRAFT,
      actorUserId,
    });

    // 2) La práctica propia de la farmacia, con el owner como administrador
    // (mismo criterio que la unidad diagnóstica y el consultorio propio).
    const practice = this.practicesRepo.create(tx, {
      tenantId: owner.tenantId,
      code: owner.code,
      name: owner.tradeName ?? owner.legalName,
      typeConceptId: PRAC.PRACTICE_TYPE_PHARMACY,
      adminUserId: owner.ownerUserId,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
      actorUserId,
    });
    // Las FK son columnas uuid planas: persistir los padres antes que los hijos.
    await tx.flush();

    // Las seis categorías de partida del catálogo (P47), como las que recibe
    // toda farmacia nueva: sin ellas el portal arranca sin dónde clasificar.
    await this.categories.provisionDefaults(tx, pharmacy.id, actorUserId);

    // Los códigos sólo tienen que ser únicos dentro de esta práctica y esta
    // farmacia, que acaban de nacer: alcanza con recordarlos en memoria.
    const usedCodes = new Set<string>();
    const codeOf = (name: string): string => {
      const base = siteCodeBase(name, 'SEDE');
      let code = base;
      for (let n = 2; usedCodes.has(code); n += 1) code = `${base}-${n}`;
      usedCodes.add(code);
      return code;
    };

    // 3) La casa central: sede de práctica + sede dispensadora, y el enlace.
    const central = await this.addSite(
      tx,
      owner,
      practice.id,
      pharmacy.id,
      profile.headquarters,
      codeOf(profile.headquarters.name),
      actorUserId,
    );
    pharmacy.primaryPracticeSiteId = central.practiceSiteId;

    // 4) Cada sucursal, igual que la central.
    const branchPharmacySiteIds: string[] = [];
    for (const branch of profile.branches ?? []) {
      const site = await this.addSite(
        tx,
        owner,
        practice.id,
        pharmacy.id,
        branch,
        codeOf(branch.name),
        actorUserId,
      );
      branchPharmacySiteIds.push(site.pharmacySiteId);
    }
    await tx.flush();

    this.logger.info(
      {
        operation: 'pharmacy.provisioning.provision',
        pharmacyId: pharmacy.id,
        branches: branchPharmacySiteIds.length,
      },
      'Pharmacy provisioned',
    );

    return {
      pharmacyId: pharmacy.id,
      practiceId: practice.id,
      headquartersPracticeSiteId: central.practiceSiteId,
      headquartersPharmacySiteId: central.pharmacySiteId,
      branchPharmacySiteIds,
    };
  }

  /**
   * Crea la dirección (si hay algo que guardar), la sede de práctica y la sede
   * dispensadora que cuelga de ella. El alta la usa para la casa central y cada
   * sucursal; la carga masiva de sucursales, para cada sede nueva.
   */
  async addSite(
    tx: EntityManager,
    owner: PharmacyOwner,
    practiceId: string,
    pharmacyId: string,
    declared: PharmacyProvisioningSite,
    code: string,
    actorUserId: string,
  ): Promise<{ practiceSiteId: string; pharmacySiteId: string }> {
    const lines = declared.addressLines?.trim();
    const hasPoint =
      declared.latitude !== undefined && declared.longitude !== undefined;
    let addressId: string | undefined;
    if ((lines !== undefined && lines.length > 0) || hasPoint) {
      // Dueño TENANT y no el usuario: la sede es de la organización, y el
      // borrado del tenant la alcanza por `owner_id` (mismo criterio que la
      // casa matriz de una aseguradora).
      const address = this.addressesRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
        ownerId: owner.tenantId,
        lines: lines !== undefined && lines.length > 0 ? lines : undefined,
        countryConceptId: CONCEPTS.COUNTRY_BO,
        useConceptId: CONCEPTS.ADDR_USE_WORK,
        typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
        // `!== undefined`, no truthiness: 0 es una coordenada válida.
        latitude: hasPoint ? String(declared.latitude) : undefined,
        longitude: hasPoint ? String(declared.longitude) : undefined,
        actorUserId,
      });
      await tx.flush();
      addressId = address.id;
    }

    const practiceSite = this.practiceSitesRepo.create(tx, {
      practiceId,
      code,
      name: declared.name,
      siteTypeConceptId: PRAC.SITE_TYPE_OFFICE,
      operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
      timeZone: owner.timeZone,
      addressId,
      managingTenantId: owner.tenantId,
      // F1: la sede pertenece al tenant de su práctica (NOT NULL desde v4.2.67).
      tenantId: owner.tenantId,
      statusConceptId: PRAC.SITE_ACTIVE,
      actorUserId,
    });
    await tx.flush();

    const pharmacySite = this.pharmacySitesRepo.create(tx, {
      pharmacyId,
      practiceSiteId: practiceSite.id,
      code,
      name: declared.name,
      pharmacySiteTypeConceptId: PHARM.SITE_TYPE_DISPENSING,
      dispensingModeConceptId: PHARM.DISPENSING_MODE_ONSITE,
      statusConceptId: PHARM.SITE_ACTIVE,
      actorUserId,
    });

    return { practiceSiteId: practiceSite.id, pharmacySiteId: pharmacySite.id };
  }
}
