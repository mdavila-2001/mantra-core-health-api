import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type { CatalogConcepts } from '../../terminology/entities';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { DirectoryReadService } from '../../directory/services/directory-read.service';
import type { Pharmacies, PharmacyLicenses, PharmacySites } from '../entities';
import type {
  PharmacyConceptDto,
  PharmacyContactPersonDto,
  PharmacyContactsResponseDto,
  PharmacyLicenseDto,
  PharmacyLicenseListResponseDto,
} from '../dto';
import { PharmacyReadRepository } from '../repositories';

/** Un día en milisegundos, para contar días de calendario. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Lo que de una farmacia sólo ve **su propio personal**: la carpeta de
 * licencias (`pharmacy.pharmacy_licenses`) y quién representa y gestiona la
 * organización dueña (`directory.tenant_legal_representatives`).
 *
 * ## Alcance
 *
 * La farmacia se busca en el tenant activo **publicada o no** —el personal de
 * una farmacia que espera verificación necesita justamente su carpeta—, y el
 * actor tiene que pertenecer a la organización dueña (membresía activa) o ser
 * de la plataforma: el mismo `assertCanRead` que protege la ficha de la
 * organización. Todo lo demás —otro tenant, un id inexistente, alguien que no
 * es de la organización— recibe el mismo 404: distinguirlos ya confirmaría que
 * ese uuid es una farmacia.
 */
@Injectable()
export class PharmacyStaffReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Consultas de la cara de lectura.
   * @param tenantAdmin - Comprobación de pertenencia a la organización.
   * @param directoryRead - Lectura del representante y las gerencias.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: PharmacyReadRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly directoryRead: DirectoryReadService,
  ) {}

  /**
   * La carpeta de licencias de la farmacia, de la farmacia entera y de cada
   * sede, con los días hasta el vencimiento ya contados.
   *
   * @param pharmacyId - La farmacia.
   * @param actor - Quien pide la lectura.
   */
  async listLicenses(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyLicenseListResponseDto> {
    const em = this.em.fork();
    const pharmacy = await this.requireStaffPharmacy(em, pharmacyId, actor);

    const licenses = await this.readRepo.findLicenses(em, pharmacy.id);
    if (licenses.length === 0) return { items: [], count: 0 };

    const [sites, concepts] = await Promise.all([
      this.readRepo.findSitesByIds(
        em,
        unique(
          licenses
            .map((license) => license.pharmacySiteId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
      this.readRepo.findConcepts(
        em,
        unique(
          licenses
            .flatMap((license) => [
              license.licenseTypeConceptId,
              license.jurisdictionConceptId,
              license.verificationStatusConceptId,
            ])
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    ]);
    const siteById = new Map(sites.map((site) => [site.id, site]));
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const now = new Date();

    const items = licenses.map((license) =>
      toLicenseDto(license, siteById, conceptById, now),
    );
    return { items, count: items.length };
  }

  /**
   * El representante legal y las gerencias de la organización dueña de la
   * farmacia. Sale de la misma lectura que `GET /tenants/me`, sin el
   * documento de identidad.
   *
   * @param pharmacyId - La farmacia.
   * @param actor - Quien pide la lectura.
   */
  async getContacts(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyContactsResponseDto> {
    const em = this.em.fork();
    const pharmacy = await this.requireStaffPharmacy(em, pharmacyId, actor);

    const representation = await this.directoryRead.readRepresentation(
      pharmacy.tenantId,
    );
    return {
      legalRepresentative: representation.legalRepresentative
        ? toContactPerson(representation.legalRepresentative)
        : null,
      executives: (representation.executives ?? []).map(toContactPerson),
    };
  }

  /**
   * La farmacia del tenant activo, sólo si el actor es de su organización (o
   * de la plataforma). Cualquier otro caso es el mismo 404.
   */
  private async requireStaffPharmacy(
    em: EntityManager,
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<Pharmacies> {
    const tenantId = requireTenantId();
    const pharmacy = await this.readRepo.findByIdInTenant(
      em,
      tenantId,
      pharmacyId,
    );
    if (!pharmacy) throw pharmacyNotFound(pharmacyId);
    try {
      await this.tenantAdmin.assertCanRead(em, pharmacy.tenantId, actor);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw pharmacyNotFound(pharmacyId);
      }
      throw error;
    }
    return pharmacy;
  }
}

/** El 404 único de esta cara de lectura. */
function pharmacyNotFound(pharmacyId: string): ResourceNotFoundException {
  return new ResourceNotFoundException('Farmacia no encontrada', {
    pharmacyId,
  });
}

/**
 * Proyecta una licencia.
 *
 * @param license - Fila leída.
 * @param siteById - Sedes de la farmacia ya resueltas.
 * @param conceptById - Conceptos ya resueltos.
 * @param now - Instante de referencia para contar los días.
 */
export function toLicenseDto(
  license: PharmacyLicenses,
  siteById: ReadonlyMap<string, PharmacySites>,
  conceptById: ReadonlyMap<string, CatalogConcepts>,
  now: Date,
): PharmacyLicenseDto {
  const site = license.pharmacySiteId
    ? siteById.get(license.pharmacySiteId)
    : undefined;
  return {
    id: license.id,
    type: optionalConcept(conceptById, license.licenseTypeConceptId),
    number: license.licenseNumber,
    siteId: license.pharmacySiteId ?? null,
    siteName: site?.name ?? null,
    jurisdiction: optionalConcept(conceptById, license.jurisdictionConceptId),
    validFrom: dateOnly(license.validFrom),
    validTo: dateOnly(license.validTo),
    daysToExpiry: daysUntil(license.validTo, now),
    verificationStatus: optionalConcept(
      conceptById,
      license.verificationStatusConceptId,
    ),
    evidenceFileId: license.evidenceFileId ?? null,
  };
}

/**
 * Días de calendario entre hoy y la fecha, comparados a medianoche UTC: algo
 * que vence hoy da `0`, no `-1` por unas horas. Mismo criterio que el legajo
 * de las unidades diagnósticas (`diagnostic-units-admin-read.service.ts`).
 */
export function daysUntil(
  value: Date | null | undefined,
  now: Date,
): number | null {
  if (!value) return null;
  const target = Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  );
  const reference = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((target - reference) / ONE_DAY_MS);
}

/** Una columna `date` como `AAAA-MM-DD`, o `null`. */
function dateOnly(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** Una persona de contacto, sin su documento de identidad. */
function toContactPerson(person: {
  readonly role: string;
  readonly fullName: string;
  readonly email?: string;
  readonly phone?: string;
}): PharmacyContactPersonDto {
  return {
    role: person.role,
    fullName: person.fullName,
    email: person.email ?? null,
    phone: person.phone ?? null,
  };
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | null | undefined,
): PharmacyConceptDto | null {
  const value = id ? concepts.get(id) : undefined;
  return value ? { code: value.code, display: value.display } : null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
