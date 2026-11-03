import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../../common';
import { COMM } from '../../../community/community.concepts';
import {
  PublicBranchAvailabilityResponseDto,
  PublicPharmacyBranchPageDto,
  PublicPrescriptionAvailabilityDto,
} from '../../presentation/dto/public-pharmacy-branches.dto';
import { PublicCatalogRepository } from '../../infrastructure/repositories/public-catalog.repository';
import { PublicPharmacyBranchesRepository } from '../../infrastructure/repositories/public-pharmacy-branches.repository';
import {
  BranchProductRow,
  PUBLIC_BRANCHES_MAX,
  PublicBranchView,
  availabilityOf,
  cleanPrescriptionItems,
  compareBranchAvailability,
  compareBranches,
  toPublicBranch,
} from '../../domain';

/**
 * P37 — las sucursales de una farmacia y la receta entre ellas, sin sesión.
 *
 * Pedido del propietario (19/09/2026): la ficha de una farmacia «debe mostrar
 * todas sus sucursales y pedirle ubicación para la más cercana recomendar dada
 * una receta médica». El front lo resolvía con el corpus de Bolivia del
 * simulador; esto lo lee de la base.
 *
 * ## Qué es la cadena (decisión D-1 de P37)
 *
 * El **tenant** dueño de la ficha. Sus sucursales son las sedes activas
 * (`pharmacy.pharmacy_sites`) de sus farmacias activas y verificadas. No se
 * sigue `parent_tenant_id`: unir tenants distintos bajo una ficha sería
 * publicar sedes que esa ficha no administra.
 *
 * ## Qué no se guarda
 *
 * Nada. La receta llega en el cuerpo, se usa para la consulta y se descarta:
 * no se registra, no se asocia a nadie y no viaja en la URL.
 */
@Injectable()
export class PublicPharmacyBranchesService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalog: PublicCatalogRepository,
    private readonly repo: PublicPharmacyBranchesRepository,
  ) {}

  /**
   * Las sucursales de la farmacia del slug, por ciudad y nombre.
   *
   * @param slug - Slug de su ficha pública.
   * @throws ResourceNotFoundException si el slug no es de una farmacia visible.
   */
  async branches(slug: string): Promise<PublicPharmacyBranchPageDto> {
    const em = this.em.fork();
    const { branches } = await this.loadBranchesWithTenant(em, slug);
    return {
      items: [...branches].sort(compareBranches),
      nextCursor: null,
      totalHint: branches.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Qué sucursal tiene lo de una receta, ya ordenadas: primero las completas,
   * después la más cercana. Toda sucursal aparece, aunque no tenga nada.
   *
   * @param slug - Slug de la ficha.
   * @param body - Renglones de la receta y, opcional, el punto de origen.
   * @throws ResourceNotFoundException si el slug no es de una farmacia visible.
   */
  async availability(
    slug: string,
    body: PublicPrescriptionAvailabilityDto,
  ): Promise<PublicBranchAvailabilityResponseDto> {
    const em = this.em.fork();
    const { tenantId, branches } = await this.loadBranchesWithTenant(em, slug);
    const terms = cleanPrescriptionItems(body.items);
    const origin =
      body.lat === undefined || body.lng === undefined
        ? null
        : { lat: body.lat, lng: body.lng };

    const products = await this.repo.findInStockMatches(
      em,
      tenantId,
      branches.map((branch) => branch.id),
      terms,
    );
    const bySite = new Map<string, BranchProductRow[]>();
    for (const product of products) {
      const list = bySite.get(product.siteId) ?? [];
      list.push(product);
      bySite.set(product.siteId, list);
    }

    const items = branches
      .map((branch) =>
        availabilityOf(branch, terms, bySite.get(branch.id) ?? [], origin),
      )
      .sort(compareBranchAvailability);
    return {
      items,
      count: items.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * El tenant de la ficha y sus sucursales proyectadas.
   *
   * Un slug inexistente, oculto o **de otro tipo** responde el mismo 404, igual
   * que `/products`: la ruta no sirve para averiguar qué hay detrás de un slug.
   */
  private async loadBranchesWithTenant(
    em: EntityManager,
    slug: string,
  ): Promise<{ tenantId: string; branches: PublicBranchView[] }> {
    const profile = await this.catalog.findVisibleProfileBySlug(em, slug);
    if (
      profile === null ||
      profile.targetTypeConceptId !== COMM.PROFILE_TARGET_PHARMACY
    ) {
      throw new ResourceNotFoundException('No encontrado', { slug });
    }
    const rows = await this.repo.findPublicSites(
      em,
      profile.tenantId,
      PUBLIC_BRANCHES_MAX,
    );
    const onlyOne = rows.length === 1;
    return {
      tenantId: profile.tenantId,
      branches: rows.map((row) => toPublicBranch(row, slug, onlyOne)),
    };
  }
}
