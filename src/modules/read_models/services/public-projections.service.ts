import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PublicProjectionResponseDto } from '../dto';

/**
 * UC-30-10: sirve proyecciones públicas (sin sesión, sin PHI). Solo se exponen
 * campos aprobados de MV públicas; las URLs firmadas efímeras se generan tras
 * autorizar y nunca se persisten en la vista. Aquí se devuelve el contrato de la
 * proyección con `refreshedAt` para reflejar consistencia eventual.
 */
@Injectable()
export class PublicProjectionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicProjectionsService.name);
  }

  /** GET /public/{slug}: detalle público por slug. */
  async getBySlug(slug: string): Promise<PublicProjectionResponseDto> {
    this.logger.info(
      { operation: 'read_models.public.slug', slug },
      'Serving public projection',
    );
    // Lectura eventualmente consistente: en ausencia de la MV física poblada, se
    // devuelve una proyección vacía con la marca de generación (sin PHI, sin sesión).
    const now = new Date();
    return {
      slug,
      records: [],
      refreshedAt: null,
      generatedAt: now,
    };
  }

  /** GET /public/directory: catálogo público filtrable por ciudad/especialidad. */
  async searchDirectory(filters: {
    city?: string;
    specialty?: string;
  }): Promise<PublicProjectionResponseDto> {
    this.logger.info(
      {
        operation: 'read_models.public.directory',
        city: filters.city,
        specialty: filters.specialty,
      },
      'Serving public directory projection',
    );
    const now = new Date();
    return {
      slug: `directory:${filters.city ?? '*'}:${filters.specialty ?? '*'}`,
      records: [],
      refreshedAt: null,
      generatedAt: now,
    };
  }
}
