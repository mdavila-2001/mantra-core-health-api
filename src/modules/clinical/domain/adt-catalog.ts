import { deterministicId } from '../../../common/constants/concepts';
import { CLIN } from '../clinical.concepts';
import { PRAC } from '../../practice/practice.concepts';

/** Una entrada resuelta de una familia de códigos de la internación. */
export interface AdtCode {
  /** Código completo (`LOC_CARE_ICU`). */
  readonly code: string;
  /** Id determinista del concepto. */
  readonly id: string;
}

/**
 * Familia de códigos con búsqueda por código completo o corto (`ICU` →
 * `LOC_CARE_ICU`) y por id de concepto. Acepta ambos y emite siempre el completo.
 */
export class AdtCodeFamily {
  private readonly byCodeMap = new Map<string, AdtCode>();
  private readonly byIdMap = new Map<string, AdtCode>();

  /**
   * @param prefix - Prefijo común de los códigos.
   * @param entries - Código completo → id de concepto.
   */
  constructor(
    private readonly prefix: string,
    entries: Readonly<Record<string, string>>,
  ) {
    for (const [code, id] of Object.entries(entries)) {
      const entry = { code, id };
      this.byCodeMap.set(code, entry);
      this.byIdMap.set(id, entry);
    }
  }

  /** Busca por código completo o corto; `undefined` si no es de la familia. */
  byInput(input: string | undefined | null): AdtCode | undefined {
    if (!input) return undefined;
    const normalized = input.trim().toUpperCase();
    return (
      this.byCodeMap.get(normalized) ??
      this.byCodeMap.get(`${this.prefix}${normalized}`)
    );
  }

  /** Busca por id de concepto. */
  byConceptId(id: string | undefined | null): AdtCode | undefined {
    return id ? this.byIdMap.get(id) : undefined;
  }

  /** Códigos completos. */
  codes(): string[] {
    return [...this.byCodeMap.keys()];
  }
}

/** Nivel de cuidado de la internación (`LOC_CARE_*`). */
export const LEVELS_OF_CARE = new AdtCodeFamily('LOC_CARE_', {
  LOC_CARE_GENERAL: CLIN.LOC_CARE_GENERAL,
  LOC_CARE_INTERMEDIATE: CLIN.LOC_CARE_INTERMEDIATE,
  LOC_CARE_ICU: CLIN.LOC_CARE_ICU,
  LOC_CARE_NEONATAL_ICU: CLIN.LOC_CARE_NEONATAL_ICU,
});

/** Procedencia del ingreso (`ADM_SRC_*`). */
export const ADMISSION_SOURCES = new AdtCodeFamily('ADM_SRC_', {
  ADM_SRC_EMERGENCY: CLIN.ADM_SRC_EMERGENCY,
  ADM_SRC_OUTPATIENT: CLIN.ADM_SRC_OUTPATIENT,
  ADM_SRC_REFERRAL: CLIN.ADM_SRC_REFERRAL,
  ADM_SRC_BIRTH: CLIN.ADM_SRC_BIRTH,
  ADM_SRC_TRANSFER_IN: CLIN.ADM_SRC_TRANSFER_IN,
});

/** Disposición al egreso (`DISP_*`). */
export const DISCHARGE_DISPOSITIONS = new AdtCodeFamily('DISP_', {
  DISP_HOME: CLIN.DISP_HOME,
  DISP_TRANSFER: CLIN.DISP_TRANSFER,
  DISP_DEATH: CLIN.DISP_DEATH,
  DISP_AGAINST_ADVICE: CLIN.DISP_AGAINST_ADVICE,
  DISP_OTHER: CLIN.DISP_OTHER,
});

/**
 * Clave `practice:ISO_*` → id. El aislamiento es de F2 (`practice.concepts.ts`):
 * los ids se derivan con la misma función de las demás claves, de modo que son
 * idénticos a los que F2 declare y F3 no depende del orden de fusión. `ISO_NONE`
 * ya está declarado en esta base.
 */
const isoId = (key: string): string => deterministicId(`practice:${key}`);

/** Precaución de transmisión (`ISO_*` de F2). */
export const ISOLATION_PRECAUTIONS = new AdtCodeFamily('ISO_', {
  ISO_NONE: PRAC.ISO_NONE,
  ISO_CONTACT: isoId('ISO_CONTACT'),
  ISO_DROPLET: isoId('ISO_DROPLET'),
  ISO_AIRBORNE: isoId('ISO_AIRBORNE'),
  ISO_PROTECTIVE: isoId('ISO_PROTECTIVE'),
});

/** Id de `practice:ISO_AIRBORNE`. */
export const ISO_AIRBORNE_ID = isoId('ISO_AIRBORNE');
/** Id de `practice:ISO_NONE`. */
export const ISO_NONE_ID = PRAC.ISO_NONE;

/** Estados del incidente de colocación. */
export const INCIDENT_STATUS = {
  OPEN: CLIN.PLC_INC_OPEN,
  REVIEWED: CLIN.PLC_INC_REVIEWED,
  CLOSED: CLIN.PLC_INC_CLOSED,
} as const;

/**
 * Funciones de cama → niveles de cuidado que admiten
 * (`F3.2`, regla `LEVEL_OF_CARE`: «tabla en el perfil de función»).
 *
 * Supuesto: el contrato fija `BED_ICU → ICU` y `BED_STANDARD → GENERAL/INTERMEDIATE`;
 * la cuna admite además cuidado intensivo neonatal y la camilla se trata como cama
 * estándar. Una función sin entrada (la genérica heredada) no restringe el nivel.
 */
export const LEVELS_BY_BED_FUNCTION: Readonly<
  Record<string, readonly string[]>
> = {
  SPACE_FN_BED_STANDARD: ['LOC_CARE_GENERAL', 'LOC_CARE_INTERMEDIATE'],
  SPACE_FN_BED_ICU: ['LOC_CARE_ICU'],
  SPACE_FN_CRIB: [
    'LOC_CARE_GENERAL',
    'LOC_CARE_INTERMEDIATE',
    'LOC_CARE_NEONATAL_ICU',
  ],
  SPACE_FN_STRETCHER: ['LOC_CARE_GENERAL', 'LOC_CARE_INTERMEDIATE'],
};
