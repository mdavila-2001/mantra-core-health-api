import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { ServiceCatalogRepository } from '../repositories';
import {
  PROCEDURE_IMPORT_MAX,
  type ImportProceduresDto,
  type ImportProceduresResponseDto,
  type MyProcedureSpecialtiesResponseDto,
} from '../dto';
import { BillingServiceCatalogService } from './billing-service-catalog.service';

/** Prefijo del código de concepto de un procedimiento del arancel. */
const PREFIX = 'procedure:';

/** Propiedades del arancel que esta importación lee. */
const PROP = {
  especialidad: 'procedure:specialty',
  precio: 'procedure:reference-price',
} as const;

/** Filas por `flush` al insertar: acota la unidad de trabajo sin un viaje por fila. */
const INSERT_CHUNK = 500;

/** Códigos por consulta al comprobar cuáles ya existen en la práctica. */
const LOOKUP_CHUNK = 1000;

/** Palabras que no distinguen una especialidad de otra. */
const STOPWORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'y',
  'e',
  'o',
  'u',
  'en',
]);

/**
 * Nombres con que el arancel de Santa Cruz llama a especialidades que el
 * catálogo de profesionales nombra distinto. Son equivalencias ya fijadas en
 * `src/common/seed/data/specialty-services/rules.json` (`boArancelHeadings`,
 * `national-name` y `section-content`); acá sólo se repiten, no se inventan.
 * Claves y valores, normalizados con {@link normalizeSpecialty}.
 */
const SPECIALTY_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'medicina de emergencia': 'emergenciologia',
  'medicina intensiva': 'medicina critica y terapia intensiva',
  'anatomia patologica': 'patologia',
});

/** Un procedimiento del arancel elegido para importar. */
export interface ProcedureImportRow {
  /**
   * Id del concepto del arancel (`terminology.catalog_concepts`). Es lo que se
   * guarda como `serviceConceptId` del servicio: las cláusulas de los seguros y
   * las solicitudes de reembolso cruzan por él, no por el id del servicio.
   */
  conceptId: string;
  /** Código del arancel (`procedure:...`). */
  code: string;
  /** Nombre del procedimiento. */
  display: string;
  /** Precio de referencia como lo publica el arancel, o `null`. */
  referencePrice: string | null;
}

/** Criterios ya normalizados de una importación. */
export interface ProcedureImportFilter {
  /** Especialidades exactas del arancel. */
  specialties: string[];
  /** Códigos de procedimiento. */
  codes: string[];
  /** Texto libre sobre el nombre. */
  q?: string;
}

/**
 * Normaliza un texto para compararlo: minúsculas, sin tildes ni signos y con
 * los espacios colapsados. Conserva `|` si el llamador lo puso.
 *
 * @param text - Texto original.
 * @returns El texto comparable.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza el nombre de una especialidad: además de {@link normalizeText},
 * descarta lo que va entre paréntesis (el arancel marca «(anexo)»).
 *
 * @param name - Nombre de la especialidad.
 * @returns El nombre comparable.
 */
export function normalizeSpecialty(name: string): string {
  return normalizeText(name.replace(/\([^)]*\)/g, ' '));
}

/**
 * La primera especialidad nombrada en un listado («Endocrinología, Metabolismo
 * y Nutrición» → «endocrinologia»): lo que va antes de la primera coma, barra
 * o conjunción. Parte del nombre **original** porque la coma ya no existe en
 * el normalizado.
 *
 * @param name - Nombre de la especialidad tal cual se publica.
 * @returns El primer segmento, normalizado.
 */
function firstSegment(name: string): string {
  const listed = normalizeText(
    name.replace(/\([^)]*\)/g, ' ').replace(/[,;/]/g, '|'),
  );
  return listed.split(/\||\s[ye]\s/)[0].trim();
}

/** Palabras con contenido de un nombre normalizado. */
function significantTokens(normalized: string): string[] {
  return normalized.split(' ').filter((t) => t !== '' && !STOPWORDS.has(t));
}

/** ¿Todas las palabras de `inner` están en `outer`? */
function isTokenSubset(inner: string[], outer: string[]): boolean {
  return inner.length > 0 && inner.every((t) => outer.includes(t));
}

/**
 * Cuáles especialidades del arancel corresponden a las del profesional.
 *
 * Por cada especialidad del profesional se prueban tres niveles y **se queda
 * con el primero que encuentra algo**, para que un nivel flojo nunca sume a uno
 * exacto (un «Neurología Pediátrica» no arrastra toda «Neurología» si el
 * arancel ya tiene la suya):
 *
 * 1. Igualdad normalizada —sin tildes, mayúsculas ni «(anexo)»— o equivalencia
 *    fijada en {@link SPECIALTY_ALIASES}.
 * 2. Mismo primer nombre de un listado: «Endocrinología» ↔ «Endocrinología,
 *    Metabolismo y Nutrición»; «Anestesiología» ↔ «Anestesiología, Reanimación
 *    y Dolor (anexo)». Sólo el **primero**, no cualquier segmento: «Rehabilitación»
 *    o «Nutrición» sueltas harían coincidir a un fisioterapeuta con Medicina
 *    Física y a un nutricionista con Endocrinología.
 * 3. El nombre del arancel está entero dentro del del profesional («Cardiología
 *    Pediátrica» ↔ «Cardiología»). Nunca al revés: «Cirugía» a secas no puede
 *    arrastrar las seis cirugías del arancel.
 *
 * @param doctorSpecialties - Nombres de especialidad del profesional.
 * @param tariffSpecialties - Especialidades del arancel, con su recuento.
 * @returns Las del arancel que corresponden, ordenadas en español.
 */
export function matchTariffSpecialties(
  doctorSpecialties: readonly string[],
  tariffSpecialties: readonly { specialty: string; count: number }[],
): { specialty: string; count: number }[] {
  const tariff = tariffSpecialties.map((entry) => {
    const normalized = normalizeSpecialty(entry.specialty);
    return {
      entry,
      normalized,
      first: firstSegment(entry.specialty),
      tokens: significantTokens(normalized),
    };
  });

  const matched = new Map<string, { specialty: string; count: number }>();
  for (const doctorName of doctorSpecialties) {
    const doctor = normalizeSpecialty(doctorName);
    if (doctor === '') continue;
    const target = SPECIALTY_ALIASES[doctor] ?? doctor;

    let hits = tariff.filter((t) => t.normalized === target);
    if (hits.length === 0) {
      const first = firstSegment(doctorName);
      hits = tariff.filter((t) => t.first === first);
    }
    if (hits.length === 0) {
      const tokens = significantTokens(doctor);
      hits = tariff.filter((t) => isTokenSubset(t.tokens, tokens));
    }
    for (const hit of hits) matched.set(hit.entry.specialty, hit.entry);
  }

  return [...matched.values()].sort((a, b) =>
    a.specialty.localeCompare(b.specialty, 'es'),
  );
}

/**
 * Importación de procedimientos del arancel al catálogo de una práctica.
 *
 * ## Por qué un servicio aparte
 *
 * `ProcedureNomenclatureService` lee el arancel para **mostrarlo**, página a
 * página. Importar necesita otra forma de la misma lectura —todas las
 * coincidencias de un filtro, con su precio, de una vez— y escribir en
 * `billing.service_catalog`, así que vive acá y deja al lector como está.
 *
 * ## Lo que reutiliza del alta individual
 *
 * El alcance (`assertRegistrationCanRegister`: la administración en cualquier
 * práctica, un profesional sólo en su consultorio propio, 404 en cualquier
 * otra) y la encuesta de satisfacción automática de FT-31. El resultado de
 * cada fila es el que daría `POST /billing/service-catalog`: `name` = nombre del
 * procedimiento, `code` = código del arancel, `serviceConceptId` = concepto
 * del arancel (por donde cruzan seguros y reembolsos), `defaultPrice` = precio de
 * referencia, activo. Como en el alta individual, no se declara moneda: el
 * precio del arancel es de una unidad (UMA) que no es dinero y convertirla sería
 * inventar un factor.
 */
@Injectable()
export class ProcedureImportService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param serviceCatalogRepo - Catálogo de servicios de la práctica.
   * @param catalog - Alcance y encuesta automática del alta individual.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly catalog: BillingServiceCatalogService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProcedureImportService.name);
  }

  /**
   * Las especialidades del arancel que corresponden al profesional.
   *
   * Parte de `profiles.practitioner_specialties` (vigentes hoy) y las cruza con
   * las del arancel con {@link matchTariffSpecialties}. Vacío si el actor no
   * tiene perfil profesional o no cargó ninguna especialidad.
   *
   * @param actor - Profesional autenticado.
   * @returns Las especialidades del arancel, con su recuento.
   */
  async listMySpecialties(
    actor: AuthenticatedUser,
  ): Promise<MyProcedureSpecialtiesResponseDto> {
    if (!actor.practitionerProfileId) return { items: [] };

    const own = await this.em.getConnection().execute<{ display: string }[]>(
      `SELECT DISTINCT cc.display
           FROM profiles.practitioner_specialties ps
           JOIN terminology.catalog_concepts cc ON cc.id = ps.specialty_concept_id
          WHERE ps.practitioner_profile_id = ?
            AND (ps.valid_to IS NULL OR ps.valid_to >= CURRENT_DATE)`,
      [actor.practitionerProfileId],
    );
    if (own.length === 0) return { items: [] };

    const tariff = await this.em
      .getConnection()
      .execute<{ especialidad: string; total: string }[]>(
        `SELECT p.value_json #>> '{}' AS especialidad, COUNT(*)::text AS total
           FROM terminology.concept_properties p
          WHERE p.property_code = ?
          GROUP BY 1
          ORDER BY 1`,
        [PROP.especialidad],
      );

    return {
      items: matchTariffSpecialties(
        own.map((row) => row.display),
        tariff
          .filter((row) => row.especialidad !== null)
          .map((row) => ({
            specialty: row.especialidad,
            count: Number(row.total),
          })),
      ),
    };
  }

  /**
   * Importa en lote al catálogo de una práctica los procedimientos del arancel
   * que cumplen el filtro.
   *
   * Idempotente: los códigos que la práctica ya tiene se saltan (misma clave
   * que el alta individual: práctica + código). Todo ocurre en una transacción;
   * si algo falla, no se crea nada.
   *
   * @param dto - Práctica y filtro.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Cuántos se crearon, cuántos se saltaron y cuántos coincidían.
   * @throws BadRequestException si no hay ningún criterio o el filtro abarca más del tope.
   * @throws ResourceNotFoundException si el actor no alcanza la práctica.
   */
  async importProcedures(
    dto: ImportProceduresDto,
    actor: AuthenticatedUser,
  ): Promise<ImportProceduresResponseDto> {
    const filter = toFilter(dto);
    this.logger.info(
      {
        operation: 'billing.service-catalog.import-procedures',
        practiceId: dto.practiceId,
        specialties: filter.specialties.length,
        codes: filter.codes.length,
        hasQuery: filter.q !== undefined,
        actorId: actor.id,
      },
      'Importing procedures into service catalog',
    );
    // El alcance primero: una práctica ajena responde 404 sin haber leído el arancel.
    await this.catalog.assertRegistrationCanRegister(actor, dto.practiceId);

    const rows = await this.select(filter);
    if (rows.length === 0) return { created: 0, skipped: 0, total: 0 };

    const created = await this.em.transactional(async (tx) => {
      // No hay índice único (práctica, código): dos importaciones simultáneas
      // de la misma práctica verían los mismos códigos como libres. El cerrojo
      // las serializa y la segunda ya encuentra lo que dejó la primera.
      await tx.execute('select pg_advisory_xact_lock(hashtext(?))', [
        `service-catalog-import:${dto.practiceId}`,
      ]);

      const existing = new Set<string>();
      for (let i = 0; i < rows.length; i += LOOKUP_CHUNK) {
        const found = await this.serviceCatalogRepo.findExistingCodes(
          tx,
          dto.practiceId,
          rows.slice(i, i + LOOKUP_CHUNK).map((row) => row.code),
        );
        for (const code of found) existing.add(code);
      }

      const pending = rows.filter((row) => !existing.has(row.code));
      for (let i = 0; i < pending.length; i += INSERT_CHUNK) {
        const items = pending.slice(i, i + INSERT_CHUNK).map((row) =>
          this.serviceCatalogRepo.create(tx, {
            practiceId: dto.practiceId,
            code: row.code,
            name: row.display,
            serviceConceptId: row.conceptId,
            defaultPrice: toDefaultPrice(row.referencePrice),
            isActive: true,
            actorUserId: actor.id,
          }),
        );
        await tx.flush();
        await this.catalog.attachDefaultSatisfactionSurveys(tx, items, actor);
      }
      return pending.length;
    });

    this.logger.info(
      {
        operation: 'billing.service-catalog.import-procedures',
        practiceId: dto.practiceId,
        created,
        skipped: rows.length - created,
      },
      'Procedures imported into service catalog',
    );
    return {
      created,
      skipped: rows.length - created,
      total: rows.length,
    };
  }

  /**
   * Los procedimientos del arancel que cumplen el filtro, con su precio.
   *
   * Los criterios se combinan con Y. La especialidad se compara exacta contra
   * la propiedad `procedure:specialty` (no contra el código, que no la contiene
   * de forma fiable); el texto, palabra por palabra y sin tildes ni mayúsculas.
   *
   * @param filter - Criterios ya normalizados.
   * @returns Las coincidencias ordenadas por código, sin repetir.
   * @throws BadRequestException si hay más de {@link PROCEDURE_IMPORT_MAX}.
   */
  async select(filter: ProcedureImportFilter): Promise<ProcedureImportRow[]> {
    const conditions: string[] = ['c.code LIKE ?'];
    const params: unknown[] = [PROP.precio, `${PREFIX}%`];

    if (filter.specialties.length > 0) {
      conditions.push(
        `EXISTS (SELECT 1 FROM terminology.concept_properties sp
                  WHERE sp.concept_id = c.id
                    AND sp.property_code = ?
                    AND sp.value_json #>> '{}' IN (${markers(filter.specialties)}))`,
      );
      params.push(PROP.especialidad, ...filter.specialties);
    }

    if (filter.codes.length > 0) {
      conditions.push(`c.code IN (${markers(filter.codes)})`);
      params.push(...filter.codes);
    }

    for (const token of queryTokens(filter.q)) {
      conditions.push(
        `translate(lower(c.display), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun') LIKE ?`,
      );
      params.push(`%${escapeLike(token)}%`);
    }

    params.push(PROCEDURE_IMPORT_MAX + 1);

    const result = await this.em.getConnection().execute<
      {
        id: string;
        code: string;
        display: string;
        price: string | null;
      }[]
    >(
      `SELECT c.id, c.code, c.display,
              (SELECT p.value_json #>> '{}'
                 FROM terminology.concept_properties p
                WHERE p.concept_id = c.id AND p.property_code = ?
                LIMIT 1) AS price
         FROM terminology.catalog_concepts c
        WHERE ${conditions.join(' AND ')}
        ORDER BY c.code
        LIMIT ?`,
      params,
    );

    if (result.length > PROCEDURE_IMPORT_MAX) {
      throw new BadRequestException(
        `El filtro abarca más de ${PROCEDURE_IMPORT_MAX} procedimientos; acotalo por especialidad o texto`,
      );
    }

    const seen = new Set<string>();
    const rows: ProcedureImportRow[] = [];
    for (const row of result) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push({
        conceptId: row.id,
        code: row.code,
        display: row.display,
        referencePrice: row.price,
      });
    }
    return rows;
  }
}

/**
 * Normaliza el cuerpo a criterios: sin vacíos ni repetidos, y al menos uno.
 *
 * @throws BadRequestException si no queda ningún criterio.
 */
function toFilter(dto: ImportProceduresDto): ProcedureImportFilter {
  const clean = (values?: string[]) => [
    ...new Set(
      (values ?? []).map((value) => value.trim()).filter((v) => v !== ''),
    ),
  ];
  const specialties = clean(dto.specialties);
  const codes = clean(dto.codes);
  const q = dto.q?.trim() ? dto.q.trim() : undefined;
  if (specialties.length === 0 && codes.length === 0 && q === undefined) {
    throw new BadRequestException(
      'Indicá al menos una especialidad, un código o un texto para importar',
    );
  }
  return { specialties, codes, q };
}

/** Marcadores `?, ?, ...` para una lista. */
function markers(values: readonly unknown[]): string {
  return values.map(() => '?').join(', ');
}

/** Palabras del texto libre, sin tildes ni mayúsculas (como las compara la consulta). */
function queryTokens(q: string | undefined): string[] {
  if (q === undefined) return [];
  return normalizeText(q.replace(/\|/g, ' '))
    .split(' ')
    .filter((token) => token !== '')
    .slice(0, 8);
}

/** Escapa los comodines de `LIKE` en un fragmento de texto. */
function escapeLike(token: string): string {
  return token.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Importe con hasta dos decimales, como lo exige el alta individual. */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * El precio de catálogo que sale del precio de referencia del arancel.
 *
 * El alta individual sólo admite importes sin signo y con hasta dos decimales:
 * lo que el arancel trae con otra forma se redondea a dos decimales y lo que no
 * es un número no negativo queda en `0`, no en un valor inventado.
 *
 * @param reference - Precio de referencia del arancel, si lo tiene.
 * @returns Importe válido para `defaultPrice`.
 */
export function toDefaultPrice(reference: string | null): string {
  if (reference === null) return '0';
  const trimmed = reference.trim();
  if (PRICE_PATTERN.test(trimmed)) return trimmed;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value.toFixed(2) : '0';
}
