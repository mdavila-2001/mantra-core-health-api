import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DynamicEnumsService } from '../../system_context/services';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';

/**
 * El campo de la receta cuyo catálogo es el de los medicamentos: lo que el
 * médico puede recetar. Un producto cruza con una receta compartida por
 * igualdad de este concepto, así que vincularlo a otro catálogo no serviría.
 */
export const MEDICATION_TARGET =
  'clinical.medication_requests.medication_concept_id';

/** Cuánto vale lo leído del catálogo: una carga de 1000 filas lo lee una vez. */
const CACHE_MS = 60_000;

/** Un medicamento del catálogo y los nombres con que se lo reconoce. */
interface MedicationOption {
  readonly conceptId: string;
  /** Nombre en castellano y nombre del concepto, sin repetir. */
  readonly names: readonly string[];
}

/** Lo que dice el catálogo de un nombre escrito. */
export type MedicationNameResolution =
  | { readonly found: true; readonly conceptId: string }
  | {
      readonly found: false;
      readonly reason: PharmacyErrorReason;
      readonly message: string;
    };

/**
 * Resuelve el medicamento de un producto **contra el catálogo de la receta**
 * (la enumeración amarrada a {@link MEDICATION_TARGET}), para que la farmacia
 * lo elija por su nombre y nunca tipee un UUID.
 *
 * El nombre se compara sin mayúsculas, tildes ni espacios de más, con el
 * nombre en castellano o con el del concepto. Un nombre que no está, o que
 * nombra a más de uno, no se adivina: vuelve con su motivo.
 *
 * Sin catálogo publicado (sin amarre o sin versión) no hay medicamentos: todo
 * nombre es «no está», como lo sería para el médico que receta.
 */
@Injectable()
export class MedicationCatalogResolver {
  private cached: {
    readonly at: number;
    readonly options: Promise<readonly MedicationOption[]>;
  } | null = null;

  constructor(private readonly enums: DynamicEnumsService) {}

  async resolveName(name: string): Promise<MedicationNameResolution> {
    const wanted = normalizeName(name);
    const matches = (await this.options()).filter((option) =>
      option.names.some((candidate) => normalizeName(candidate) === wanted),
    );
    if (wanted === '' || matches.length === 0) {
      return {
        found: false,
        reason: PharmacyErrorReason.MEDICATION_NOT_FOUND,
        message: `«${name.trim()}» no está en el catálogo de medicamentos: escríbalo como figura en la receta`,
      };
    }
    if (matches.length > 1) {
      return {
        found: false,
        reason: PharmacyErrorReason.MEDICATION_AMBIGUOUS,
        message: `«${name.trim()}» nombra a más de un medicamento del catálogo: vincúlelo desde la ficha del producto`,
      };
    }
    return { found: true, conceptId: matches[0].conceptId };
  }

  /** Si el concepto es un medicamento del catálogo con que se receta. */
  async isMedication(conceptId: string): Promise<boolean> {
    return (await this.options()).some(
      (option) => option.conceptId === conceptId,
    );
  }

  /**
   * Vincula el producto al medicamento (o lo desvincula con `null`) y dice si
   * cambió algo. El concepto tiene que ser del catálogo con que se receta (422);
   * en un producto del catálogo universal sólo se completa el que falta, el que
   * trajo el registro oficial no se cambia (400).
   */
  async link(
    product: {
      catalogProductConceptId?: string | null;
      medicationConceptId?: string | null;
    },
    conceptId: string | null,
  ): Promise<boolean> {
    const current = product.medicationConceptId ?? null;
    if (conceptId === current) return false;
    if (product.catalogProductConceptId != null && current !== null) {
      throw new BadRequestException(
        'medicationConceptId viene del catálogo oficial y no se cambia',
      );
    }
    if (conceptId !== null && !(await this.isMedication(conceptId))) {
      throw new PreconditionFailedException(
        'Ese medicamento no está en el catálogo con que se receta',
        {
          field: 'medicationConceptId',
          reason: PharmacyErrorReason.MEDICATION_NOT_IN_CATALOG,
        },
        PharmacyErrorReason.MEDICATION_NOT_IN_CATALOG,
      );
    }
    // La entidad tipa la columna como `string | undefined`: `null` la vacía.
    Object.assign(product, { medicationConceptId: conceptId });
    return true;
  }

  private options(): Promise<readonly MedicationOption[]> {
    const now = Date.now();
    if (this.cached === null || now - this.cached.at > CACHE_MS) {
      const options = this.read();
      this.cached = { at: now, options };
      // Un fallo no se guarda: la próxima fila vuelve a preguntar.
      options.catch(() => {
        if (this.cached?.options === options) this.cached = null;
      });
    }
    return this.cached.options;
  }

  private async read(): Promise<readonly MedicationOption[]> {
    try {
      const enumeration = await this.enums.readEnum({
        target: MEDICATION_TARGET,
      });
      return enumeration.options.map((option) => ({
        conceptId: option.conceptId,
        names: [
          ...new Set(
            [option.displayEs, option.display].filter(
              (text): text is string => typeof text === 'string',
            ),
          ),
        ],
      }));
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof PreconditionFailedException
      ) {
        return [];
      }
      throw error;
    }
  }
}

/** Un nombre sin mayúsculas, tildes ni espacios de más. */
export function normalizeName(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
