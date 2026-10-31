import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { TenantZonePort } from '../../services/support-access-context.ports';

/** Zona horaria de la organización (`directory.tenants.time_zone`). */
@Injectable()
export class TenantZoneAdapter implements TenantZonePort {
  async timeZoneOf(
    em: EntityManager,
    tenantId: string,
  ): Promise<string | undefined> {
    const rows = await em.execute<{ time_zone: string | null }[]>(
      'select time_zone from directory.tenants where id = ?',
      [tenantId],
    );
    return rows[0]?.time_zone ?? undefined;
  }
}
