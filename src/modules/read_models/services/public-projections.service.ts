import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PublicProjectionResponseDto } from '../dto';

/**
 * Vista materializada pública del directorio (sin PHI ni PII). El esquema, el
 * nombre de la vista y las columnas expuestas son constantes del módulo —una
 * lista blanca—: nunca provienen del input del usuario, así que su interpolación
 * es segura. Los valores de filtro (slug/city/specialty) sí van parametrizados.
 */
const PUBLIC_DIRECTORY_SCHEMA = 'read_models';
const PUBLIC_DIRECTORY_VIEW = 'public_provider_directory';
/** Allow-list de columnas servidas públicamente (campos aprobados, sin PII/PHI). */
const PUBLIC_DIRECTORY_FIELDS = [
  'slug',
  'display_name',
  'city',
  'specialty',
] as const;
/** Página fija: el directorio público nunca devuelve el catálogo completo. */
const PUBLIC_DIRECTORY_PAGE_SIZE = 50;

const QUALIFIED_VIEW = `"${PUBLIC_DIRECTORY_SCHEMA}"."${PUBLIC_DIRECTORY_VIEW}"`;
const SELECTED_COLUMNS = PUBLIC_DIRECTORY_FIELDS.map((c) => `"${c}"`).join(', ');

/**
 * UC-30-10: sirve proyecciones públicas (sin sesión, sin PHI). Solo se exponen
 * campos aprobados de la MV pública; las URLs firmadas efímeras se generan tras
 * autorizar y nunca se persisten en la vista. Se LEE de la MV real: si aún no
 * existe físicamente, la lectura se degrada a vacío (no hay sesión ni PHI que
 * exponer) pero nunca se finge éxito.
 */
@Injectable()
export class PublicProjectionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicProjectionsService.name);
  }

  /** GET /public/{slug}: detalle público por slug (lee de la MV pública real). */
  async getBySlug(slug: string): Promise<PublicProjectionResponseDto> {
    this.logger.info(
      { operation: 'read_models.public.slug', slug },
      'Serving public projection',
    );
    const now = new Date();
    try {
      const records = await this.em
        .getConnection()
        .execute<Record<string, unknown>[]>(
          `SELECT ${SELECTED_COLUMNS} FROM ${QUALIFIED_VIEW} WHERE "slug" = ? LIMIT 1`,
          [slug],
          'all',
        );
      return {
        slug,
        records: records ?? [],
        refreshedAt: null,
        generatedAt: now,
      };
    } catch (err) {
      // La MV pública puede no estar materializada todavía: se degrada a vacío.
      this.logger.warn(
        { operation: 'read_models.public.slug', slug, error: this.reason(err) },
        'Public projection unavailable',
      );
      return { slug, records: [], refreshedAt: null, generatedAt: now };
    }
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
    const slug = `directory:${filters.city ?? '*'}:${filters.specialty ?? '*'}`;

    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters.city) {
      clauses.push('"city" = ?');
      params.push(filters.city);
    }
    if (filters.specialty) {
      clauses.push('"specialty" = ?');
      params.push(filters.specialty);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    // Paginación acotada: constante del módulo, no interpolada desde el input.
    params.push(PUBLIC_DIRECTORY_PAGE_SIZE);

    try {
      const records = await this.em
        .getConnection()
        .execute<Record<string, unknown>[]>(
          `SELECT ${SELECTED_COLUMNS} FROM ${QUALIFIED_VIEW}${where} ORDER BY "display_name" LIMIT ?`,
          params,
          'all',
        );
      return {
        slug,
        records: records ?? [],
        refreshedAt: null,
        generatedAt: now,
      };
    } catch (err) {
      this.logger.warn(
        {
          operation: 'read_models.public.directory',
          error: this.reason(err),
        },
        'Public directory projection unavailable',
      );
      return { slug, records: [], refreshedAt: null, generatedAt: now };
    }
  }

  /** Mensaje de error acotado para la bitácora (nunca se filtra al cliente público). */
  private reason(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return message.slice(0, 500);
  }
}
