/**
 * Calidad honesta de una explicación de catálogo (tabla, columna, operación, campo de DTO).
 *
 * El catálogo estático (`inventario/catalogo`) y el de operaciones (`inventario/endpoints`) traen
 * texto de cuatro orígenes muy distintos y, hasta ahora, todos se mostraban igual. Este módulo les
 * pone una etiqueta que dice **qué clase de texto es**, sin tocar el texto:
 *
 * - `CURADA`: lo escribió una persona para ESA tabla/columna/operación (comentario del modelo, JSDoc
 *   de la entidad, nota propia de la bóveda). **No** significa revisada ni aprobada: eso es
 *   `review_status` de la ficha y, hoy, nada está aprobado.
 * - `PLANTILLA`: una frase que se repite en tres o más objetos distintos una vez quitado lo que
 *   varía (nombre de la tabla, de la columna, números), o que cumple un molde de generador
 *   («Valor de X mantenido por la instancia»). Es relleno: no explica ESTE objeto.
 * - `AUTO_DETECTADA`: la armó una regla determinista o una herramienta con datos con fuente
 *   (estructura del DDL, `created_at`/`tenant_id`/…, el `summary` del contrato). Es un hecho de
 *   sistema, no una explicación de negocio revisada.
 * - `VACIA`: no hay fuente. Se informa como brecha; **nunca** se rellena.
 *
 * Todo es puro y determinista: la misma entrada da la misma etiqueta.
 */

export const EXPLANATION_QUALITIES = [
  'CURADA',
  'PLANTILLA',
  'AUTO_DETECTADA',
  'VACIA',
] as const;
export type ExplanationQuality = (typeof EXPLANATION_QUALITIES)[number];

export type ExplanationSource =
  | 'COMENTARIO_MODELO'
  | 'JSDOC_ENTIDAD'
  | 'NOTA_BOVEDA'
  | 'REGLA_DETERMINISTA'
  | 'ESTRUCTURA_DDL'
  | 'CONTRATO_OPENAPI'
  | 'REVISION_HUMANA'
  | 'NINGUNA';

/** Un texto con su etiqueta, su fuente y la razón de la etiqueta (para que sea auditable). */
export interface QualifiedText {
  quality: ExplanationQuality;
  /** El texto tal como está en la fuente; `null` si es `VACIA`. */
  text: string | null;
  source: ExplanationSource;
  /** Dónde está el texto (ruta, archivo:línea, id de regla). */
  reference: string | null;
  /** Por qué recibió esa etiqueta. */
  reason: string;
}

/** Repeticiones, ya normalizado el texto, a partir de las cuales es plantilla (igual que la bóveda). */
export const TEMPLATE_THRESHOLD = 3;

/** Largo mínimo de un token del nombre para reemplazarlo por `<T>`: evita comerse `de`, `en`, `id`. */
const MIN_NAME_TOKEN = 4;

const escapar = (texto: string): string =>
  texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * El texto sin lo que varía entre objetos: lo que queda es el molde. Reemplaza el nombre completo y
 * cada palabra del nombre (`accounts_history` → `accounts`, `history`) por `<T>`, lo que va entre
 * comillas simples por `<C>` y los números por `<N>`.
 */
export function skeletonOf(text: string, names: readonly string[]): string {
  const tokens = new Set<string>();
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower.length >= MIN_NAME_TOKEN) tokens.add(lower);
    for (const part of lower.split(/[._]/))
      if (part.length >= MIN_NAME_TOKEN) tokens.add(part);
  }
  let out = text
    .toLowerCase()
    .replace(/`[^`]*`/g, '<c>')
    .replace(/\s+/g, ' ');
  for (const token of [...tokens].sort((a, b) => b.length - a.length))
    out = out.replace(
      new RegExp(`(?<![a-z0-9_])${escapar(token)}(?![a-z0-9_])`, 'g'),
      '<t>',
    );
  return out.replace(/\d+/g, '<n>').replace(/\s+/g, ' ').trim();
}

/**
 * Cuenta en cuántos objetos DISTINTOS aparece cada molde. `isTemplate` consulta ese conteo.
 * Un mismo objeto que repite su frase no cuenta dos veces.
 */
export class TemplateIndex {
  private readonly owners = new Map<string, Set<string>>();

  constructor(private readonly threshold: number = TEMPLATE_THRESHOLD) {}

  add(
    ownerId: string,
    text: string | null | undefined,
    names: readonly string[],
  ): void {
    if (!text) return;
    const key = skeletonOf(text, names);
    const set = this.owners.get(key) ?? new Set<string>();
    set.add(ownerId);
    this.owners.set(key, set);
  }

  countOf(text: string, names: readonly string[]): number {
    return this.owners.get(skeletonOf(text, names))?.size ?? 0;
  }

  isTemplate(text: string, names: readonly string[]): boolean {
    return this.countOf(text, names) >= this.threshold;
  }
}

/**
 * Moldes de generador conocidos: frases que una herramienta arma a partir del nombre del campo.
 * Valen aunque el molde aparezca menos de {@link TEMPLATE_THRESHOLD} veces.
 */
export const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /^valor de .+ mantenido por la instancia\.?$/i,
  /^identificador asociado a .+\.?$/i,
  /^preserva versiones o estados hist[óo]ricos de /i,
  /^fk\s*(→|->)\s*[\w.]+$/i,
];

export const isPlaceholder = (text: string): boolean =>
  PLACEHOLDER_PATTERNS.some((patron) => patron.test(text.trim()));

/** Una regla determinista sobre el nombre de una columna estándar. */
export interface StandardColumnRule {
  id: string;
  /** El nombre exacto que activa la regla. */
  name: string;
  /** Tipos nativos (prefijo) en que la regla es cierta; vacío = cualquiera. */
  nativeTypes: readonly string[];
  description: string;
}

/**
 * Columnas cuya semántica no depende de la tabla. Cada fila es un hecho de convención del modelo
 * (`created_at`, `row_version`, `tenant_id`…); ninguna afirma nada del negocio de una tabla en
 * particular. La procedencia de todas es `REGLA_DETERMINISTA`.
 */
export const STANDARD_COLUMN_RULES: readonly StandardColumnRule[] = [
  {
    id: 'std.id',
    name: 'id',
    nativeTypes: ['uuid'],
    description: 'Identificador único de la instancia.',
  },
  {
    id: 'std.created_at',
    name: 'created_at',
    nativeTypes: ['timestamp'],
    description: 'Fecha y hora en que se creó el registro.',
  },
  {
    id: 'std.updated_at',
    name: 'updated_at',
    nativeTypes: ['timestamp'],
    description: 'Fecha y hora de la última actualización.',
  },
  {
    id: 'std.row_version',
    name: 'row_version',
    nativeTypes: ['int', 'bigint', 'smallint'],
    description: 'Versión usada para controlar actualizaciones concurrentes.',
  },
  {
    id: 'std.created_by_user_id',
    name: 'created_by_user_id',
    nativeTypes: ['uuid'],
    description: 'Identificador del usuario que creó el registro.',
  },
  {
    id: 'std.updated_by_user_id',
    name: 'updated_by_user_id',
    nativeTypes: ['uuid'],
    description: 'Identificador del usuario que hizo la última actualización.',
  },
  {
    id: 'std.tenant_id',
    name: 'tenant_id',
    nativeTypes: ['uuid'],
    description:
      'Identificador de la organización (tenant) a la que pertenece el registro.',
  },
  {
    id: 'std.deleted_at',
    name: 'deleted_at',
    nativeTypes: ['timestamp'],
    description:
      'Fecha y hora de la eliminación lógica del registro; nulo mientras no se eliminó.',
  },
  {
    id: 'std.archived_at',
    name: 'archived_at',
    nativeTypes: ['timestamp'],
    description:
      'Fecha y hora en que se archivó el registro; nulo mientras no se archivó.',
  },
  {
    id: 'std.valid_from',
    name: 'valid_from',
    nativeTypes: ['timestamp', 'date'],
    description: 'Inicio de la vigencia del registro.',
  },
  {
    id: 'std.valid_to',
    name: 'valid_to',
    nativeTypes: ['timestamp', 'date'],
    description: 'Fin de la vigencia del registro; nulo mientras siga vigente.',
  },
];

const RULES_BY_NAME: ReadonlyMap<string, StandardColumnRule> = new Map(
  STANDARD_COLUMN_RULES.map((regla) => [regla.name, regla]),
);

/** La regla estándar que corresponde a una columna, o `null` (nombre distinto o tipo que no encaja). */
export function standardRuleOf(
  columnName: string,
  nativeType: string,
): StandardColumnRule | null {
  const regla = RULES_BY_NAME.get(columnName);
  if (!regla) return null;
  const tipo = nativeType.toLowerCase();
  if (
    regla.nativeTypes.length > 0 &&
    !regla.nativeTypes.some((prefijo) => tipo.startsWith(prefijo))
  )
    return null;
  return regla;
}

const vacia = (reason: string): QualifiedText => ({
  quality: 'VACIA',
  text: null,
  source: 'NINGUNA',
  reference: null,
  reason,
});

export interface ColumnDescriptionInput {
  /** Texto descrito por el inventario, si lo hay. */
  text: string | null;
  /** Tipo de origen en el inventario: `JSDOC_ESTANDAR`, `JSDOC_ENTIDAD`, `MODELO_PUML`. */
  kind: string | null;
  reference: string | null;
}

/**
 * Explicación de NEGOCIO de una columna. Orden de decisión:
 * 1. texto propio (ni molde de generador ni repetido en {@link TEMPLATE_THRESHOLD} objetos) → `CURADA`:
 *    gana incluso sobre una columna estándar, porque es más específico;
 * 2. columna estándar por nombre y tipo → `AUTO_DETECTADA` (regla determinista);
 * 3. texto que es molde o se repite → `PLANTILLA`;
 * 4. sin nada → `VACIA`.
 */
export function classifyColumnBusiness(
  column: {
    name: string;
    nativeType: string;
    description: ColumnDescriptionInput;
  },
  tableNames: readonly string[],
  index: TemplateIndex,
): QualifiedText {
  const { text, kind, reference } = column.description;
  const tiene = Boolean(text && text.trim());
  const fuente: ExplanationSource =
    kind === 'MODELO_PUML' ? 'COMENTARIO_MODELO' : 'JSDOC_ENTIDAD';
  const names = [...tableNames, column.name];
  const molde = tiene && isPlaceholder(text as string);
  const repeticiones =
    tiene && !molde ? index.countOf(text as string, names) : 0;
  const regla = standardRuleOf(column.name, column.nativeType);
  if (
    tiene &&
    !molde &&
    repeticiones < TEMPLATE_THRESHOLD &&
    !(regla && text === regla.description)
  )
    return {
      quality: 'CURADA',
      text: text,
      source: fuente,
      reference,
      reason:
        'Texto propio de la columna (comentario del modelo o JSDoc de la entidad)',
    };
  if (regla)
    return {
      quality: 'AUTO_DETECTADA',
      text: regla.description,
      source: 'REGLA_DETERMINISTA',
      reference: regla.id,
      reason: `Columna estándar «${regla.name}»: descripción de convención, igual en toda tabla`,
    };
  if (tiene)
    return {
      quality: 'PLANTILLA',
      text: text,
      source: fuente,
      reference,
      reason: molde
        ? 'Molde de generador: se arma con el nombre del campo, no lo explica'
        : `El mismo molde aparece en ${repeticiones} objetos distintos`,
    };
  return vacia('Sin comentario del modelo ni JSDoc');
}

/**
 * Propósito de una TABLA. `vaultText` es la nota propia de la bóveda (ya filtrada: nunca una
 * plantilla de la bóveda); si el comentario del modelo es plantilla y la bóveda tiene texto propio,
 * gana la bóveda.
 */
export function classifyTablePurpose(
  table: {
    id: string;
    name: string;
    purpose: { text: string | null; reference: string | null };
  },
  index: TemplateIndex,
  vaultText: { text: string; reference: string } | null = null,
): QualifiedText {
  const { text, reference } = table.purpose;
  const names = [table.name];
  const plantilla =
    !!text && (isPlaceholder(text) || index.isTemplate(text, names));
  if (text && !plantilla)
    return {
      quality: 'CURADA',
      text,
      source: 'COMENTARIO_MODELO',
      reference,
      reason: 'Comentario del modelo escrito para esta tabla',
    };
  if (vaultText)
    return {
      quality: 'CURADA',
      text: vaultText.text,
      source: 'NOTA_BOVEDA',
      reference: vaultText.reference,
      reason: 'Nota propia de la bóveda (no es plantilla de la bóveda)',
    };
  if (text)
    return {
      quality: 'PLANTILLA',
      text,
      source: 'COMENTARIO_MODELO',
      reference,
      reason: `Molde repetido: ${index.countOf(text, names)} tablas comparten esta frase`,
    };
  return vacia(
    'La tabla no tiene comentario en el modelo ni nota propia en la bóveda',
  );
}

/**
 * Explicación de una OPERACIÓN. El inventario ya etiqueta `AUTO_DETECTADA` a lo que arma la
 * herramienta; sólo un estado que no sea ése (una revisión humana) es `CURADA`.
 */
export function classifyOperationExplanation(
  explanation: { estado: string; texto: string | null },
  reviewState: string,
  reference: string,
): QualifiedText {
  if (!explanation.texto) return vacia('SIN_FUENTE en el inventario');
  if (
    explanation.estado === 'AUTO_DETECTADA' &&
    reviewState === 'AUTO_DETECTADA'
  )
    return {
      quality: 'AUTO_DETECTADA',
      text: explanation.texto,
      source: 'CONTRATO_OPENAPI',
      reference,
      reason:
        'Armada por la herramienta con el summary del contrato, el README y el modelo; nadie la revisó',
    };
  return {
    quality: 'CURADA',
    text: explanation.texto,
    source: 'REVISION_HUMANA',
    reference,
    reason: `Estado de revisión «${reviewState}»`,
  };
}

/** Descripción de un campo de DTO (petición/respuesta). */
export function classifyDtoFieldDescription(
  field: { name: string; description: string | null },
  dtoName: string,
  index: TemplateIndex,
  reference: string | null,
): QualifiedText {
  if (!field.description?.trim()) return vacia('El DTO no describe este campo');
  const text = field.description;
  const names = [field.name, dtoName];
  if (isPlaceholder(text) || index.isTemplate(text, names))
    return {
      quality: 'PLANTILLA',
      text,
      source: 'JSDOC_ENTIDAD',
      reference,
      reason: 'Molde de generador o frase repetida en varios campos',
    };
  return {
    quality: 'CURADA',
    text,
    source: 'JSDOC_ENTIDAD',
    reference,
    reason: 'Texto propio del campo (JSDoc / ApiProperty)',
  };
}

/** Cuenta cuántos textos hay de cada calidad. */
export type QualityTally = Record<ExplanationQuality, number>;

export const emptyTally = (): QualityTally => ({
  CURADA: 0,
  PLANTILLA: 0,
  AUTO_DETECTADA: 0,
  VACIA: 0,
});

export function tally(items: readonly QualifiedText[]): QualityTally {
  const out = emptyTally();
  for (const item of items) out[item.quality] += 1;
  return out;
}
