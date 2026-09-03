import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { decodeKeysetCursor, encodeKeysetCursor } from '../../../common';
import type {
  ProcedureNomenclatureItemDto,
  ProcedureNomenclatureResponseDto,
  ProcedureSpecialtiesResponseDto,
} from '../dto';

/** Prefijo del código de concepto de un procedimiento del arancel boliviano. */
const PREFIJO = 'procedure:';

/** Las propiedades que el arancel escribe por procedimiento. */
const PROP = {
  especialidad: 'procedure:specialty',
  grupo: 'procedure:group',
  precio: 'procedure:reference-price',
  unidad: 'procedure:price-unit',
  /**
   * El texto de origen necesita revisión humana.
   *
   * El nombre de la propiedad es `review-needed` y no «ocr»: el catálogo la
   * escribe **sólo** en las 228 filas que salieron dañadas del reconocimiento
   * óptico del arancel, y su valor es siempre `true` — la ausencia es el «no».
   */
  revision: 'procedure:review-needed',
} as const;

/** Entradas por página cuando el cliente no pide otra cosa. */
const LIMITE_POR_DEFECTO = 25;

/**
 * Lectura del nomenclador de procedimientos (`VS_BO_MEDICAL_PROCEDURE`).
 *
 * ## Por qué existe, si la terminología ya se puede consultar
 *
 * Porque lo que la pantalla necesita **no es un concepto**: es el
 * procedimiento con su especialidad, su grupo, su precio de referencia y su
 * unidad, que viven en `terminology.concept_properties` —una fila por
 * propiedad—. Resolverlo con el buscador genérico obliga a pedir el detalle de
 * cada concepto por separado: 4408 entradas son 4408 viajes para dibujar una
 * grilla.
 *
 * ## Por qué vive en `billing` y no en `terminology`
 *
 * Por la regla 60 del pack: la operación va donde está su caso de uso. El
 * nomenclador se lee **para importar un servicio al catálogo**, y el catálogo
 * es `billing.service_catalog`. Terminología sigue siendo la dueña del dato;
 * esto es una lectura orientada a ese uso.
 *
 * ## Lo que NO hace, y es deliberado
 *
 * **No convierte la UMA a bolivianos.** `UMA` es la unidad de cuenta del
 * arancel de honorarios, no una moneda, y el factor de conversión no está
 * declarado en ninguna parte del producto. El precio viaja con su unidad para
 * que quien importe sepa qué está copiando; inventar el factor sería poner un
 * número en la lista de precios de un profesional.
 */
@Injectable()
export class ProcedureNomenclatureService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Las especialidades del nomenclador, con su recuento.
   *
   * Se agrupa **en la base** y no en memoria: traer las 4408 entradas para
   * contar por especialidad es exactamente lo que este endpoint evita.
   *
   * @returns Las especialidades, ordenadas en español.
   */
  async listSpecialties(): Promise<ProcedureSpecialtiesResponseDto> {
    const filas = await this.em
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
      items: filas
        .filter((fila) => fila.especialidad !== null)
        .map((fila) => ({
          specialty: fila.especialidad,
          count: Number(fila.total),
        })),
    };
  }

  /**
   * Una página del nomenclador.
   *
   * Ordena por `code`, que es único y estable: el cursor se apoya en él y no
   * en el nombre, que se repite —hay decenas de procedimientos llamados
   * «General»— y dejaría filas fuera al paginar.
   *
   * @param options - Filtros y paginación.
   * @returns La página, con el cursor de la siguiente.
   */
  async search(options: {
    /** Especialidad exacta, tal cual la publica el arancel. */
    specialty?: string;
    /** Texto libre sobre el nombre del procedimiento. */
    query?: string;
    /** Cursor opaco devuelto por la página anterior. */
    cursor?: string;
    /** Entradas por página. */
    limit?: number;
  }): Promise<ProcedureNomenclatureResponseDto> {
    const limite = options.limit ?? LIMITE_POR_DEFECTO;
    const cursor = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const desdeCode =
      typeof cursor?.code === 'string' ? cursor.code : undefined;

    const condiciones: string[] = ['c.code LIKE ?'];
    const params: unknown[] = [`${PREFIJO}%`];

    if (options.specialty !== undefined && options.specialty !== '') {
      // La especialidad se compara contra la propiedad, no contra el código:
      // el código del arancel no la contiene de forma fiable.
      condiciones.push(
        `EXISTS (SELECT 1 FROM terminology.concept_properties sp
                  WHERE sp.concept_id = c.id
                    AND sp.property_code = ?
                    AND sp.value_json #>> '{}' = ?)`,
      );
      params.push(PROP.especialidad, options.specialty);
    }

    if (options.query !== undefined && options.query.trim() !== '') {
      condiciones.push('c.display ILIKE ?');
      params.push(`%${options.query.trim()}%`);
    }

    if (desdeCode !== undefined) {
      condiciones.push('c.code > ?');
      params.push(desdeCode);
    }

    // Una fila de más para saber si hay página siguiente, sin pagar un COUNT
    // sobre las 4408 entradas en cada página.
    params.push(limite + 1);

    const filas = await this.em
      .getConnection()
      .execute<{ id: string; code: string; display: string }[]>(
        `SELECT c.id, c.code, c.display
         FROM terminology.catalog_concepts c
        WHERE ${condiciones.join(' AND ')}
        ORDER BY c.code
        LIMIT ?`,
        params,
      );

    const hayMas = filas.length > limite;
    const pagina = hayMas ? filas.slice(0, limite) : filas;
    if (pagina.length === 0) return { items: [], nextCursor: null };

    const propiedades = await this.propiedadesDe(pagina.map((f) => f.id));

    const items: ProcedureNomenclatureItemDto[] = pagina.map((fila) => {
      const suyas = propiedades.get(fila.id) ?? new Map<string, string>();
      return {
        conceptId: fila.id,
        code: fila.code,
        display: fila.display,
        specialty: suyas.get(PROP.especialidad) ?? null,
        group: suyas.get(PROP.grupo) ?? null,
        referencePrice: suyas.get(PROP.precio) ?? null,
        priceUnit: suyas.get(PROP.unidad) ?? null,
        // Ausente vale `false`: la marca se escribe sólo cuando hay daño.
        ocrSuspect: (suyas.get(PROP.revision) ?? 'false') === 'true',
      };
    });

    const ultima = pagina[pagina.length - 1];
    return {
      items,
      nextCursor: hayMas ? encodeKeysetCursor({ code: ultima.code }) : null,
    };
  }

  /**
   * Las propiedades de un lote de conceptos, indexadas.
   *
   * Una sola consulta para toda la página: pedirlas concepto por concepto es
   * el N+1 que este servicio existe para evitar.
   *
   * @param conceptIds - Conceptos de la página.
   * @returns Mapa de concepto a (código de propiedad → valor).
   */
  private async propiedadesDe(
    conceptIds: readonly string[],
  ): Promise<Map<string, Map<string, string>>> {
    if (conceptIds.length === 0) return new Map();

    const marcadores = conceptIds.map(() => '?').join(', ');
    const filas = await this.em
      .getConnection()
      .execute<
        { concept_id: string; property_code: string; valor: string | null }[]
      >(
        `SELECT p.concept_id, p.property_code, p.value_json #>> '{}' AS valor
         FROM terminology.concept_properties p
        WHERE p.concept_id IN (${marcadores})`,
        [...conceptIds],
      );

    const mapa = new Map<string, Map<string, string>>();
    for (const fila of filas) {
      if (fila.valor === null) continue;
      const suyas = mapa.get(fila.concept_id) ?? new Map<string, string>();
      suyas.set(fila.property_code, fila.valor);
      mapa.set(fila.concept_id, suyas);
    }
    return mapa;
  }
}
