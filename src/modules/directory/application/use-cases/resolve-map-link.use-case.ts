import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import {
  MAP_LINK_RESOLVER_PORT,
  type MapLinkResolverPort,
} from '../../domain/ports/map-link-resolver.port';
import type { ResolveMapLinkResponseDto } from '../../dto/resolve-map-link.dto';
import { TenantAdministrationService } from '../../services/tenant-administration.service';

/**
 * Tells the branch form where a pasted map link points, so the pin can be
 * shown before the branch is saved. Only OWNER/ADMIN of the organization (or
 * the platform) may ask, since the server fetches on their behalf.
 */
@Injectable()
export class ResolveMapLinkUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantAdmin: TenantAdministrationService,
    @Inject(MAP_LINK_RESOLVER_PORT)
    private readonly resolver: MapLinkResolverPort,
  ) {}

  async execute(
    tenantId: string,
    url: string,
    actor: AuthenticatedUser,
  ): Promise<ResolveMapLinkResponseDto> {
    await this.tenantAdmin.assertCanAdminister(this.em.fork(), tenantId, actor);
    const point = await this.resolver.resolve(url);
    return point ? { resolved: true, ...point } : { resolved: false };
  }
}
