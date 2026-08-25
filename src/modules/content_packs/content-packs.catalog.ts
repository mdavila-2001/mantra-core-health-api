/**
 * Los paquetes de contenido que la plataforma puede aplicar a demanda.
 *
 * ## Qué es un paquete de contenido
 *
 * Material curado que la instalación **puede** querer —el nomenclador de
 * procedimientos de Bolivia, las aseguradoras del país, el glosario médico— y
 * que hasta ahora se sembraba solo en cada arranque, tuviera sentido o no para
 * quien estaba desplegando.
 *
 * No confundir con el **núcleo**: el catálogo de conceptos, las enumeraciones
 * dinámicas, los canales de mensajería y los roles no son paquetes. Sin ellos la
 * base no acepta una escritura, así que no hay nada que elegir; los siembra el
 * arranque y punto (ver `seed-boot.env.ts`).
 *
 * ## Por qué el catálogo es estático y no una tabla
 *
 * Porque cada paquete **es** un servicio de siembra: aplicar uno es correr un
 * código concreto, no interpretar una fila. Una tabla de paquetes obligaría a
 * mantener sincronizados un registro en base y un `switch` en el código, con la
 * garantía habitual de que un día dejen de coincidir.
 *
 * Y por eso tampoco hay estado de «aplicado»: los seeds son idempotentes, así
 * que volver a aplicar uno devuelve cero filas nuevas. Ese cero **es** el
 * reporte honesto de «ya estaba», y no puede desincronizarse de la realidad como
 * sí lo haría una marca guardada aparte.
 */

/** Códigos de los paquetes aplicables. */
export const CONTENT_PACK_CODES = [
  'GLOSARIO',
  'ESTABLECIMIENTOS_BO',
  'DIRECTORIO_MEDICOS_BO',
  'ASEGURADORAS_BO',
  'ARANCEL_BO',
  'VADEMECUM',
  'FORMULARIOS_CLINICOS',
  'CUENTAS_DEMO',
] as const;

/** Un paquete de contenido, por su código. */
export type ContentPackCode = (typeof CONTENT_PACK_CODES)[number];

/** La ficha de un paquete: lo que hace falta para decidir si aplicarlo. */
export interface ContentPackDefinition {
  readonly code: ContentPackCode;
  /** Nombre legible, para la pantalla. */
  readonly name: string;
  /** Qué trae y para qué sirve. */
  readonly description: string;
  /**
   * Cuántas filas trae, aproximadamente.
   *
   * Orientativo y a propósito: el número exacto depende de qué haya ya en la
   * base. Sirve para que quien lo aplica sepa si va a esperar un segundo o
   * varios, no para cuadrar contra el resultado.
   */
  readonly approxRows: number;
  /**
   * Si necesita una contraseña para las cuentas que crea.
   *
   * Sólo `CUENTAS_DEMO`: es el único que da de alta personas que después van a
   * iniciar sesión.
   */
  readonly requiresDemoPassword?: boolean;
}

/** El catálogo, en el orden en que conviene aplicarlo. */
export const CONTENT_PACKS: readonly ContentPackDefinition[] = [
  {
    code: 'GLOSARIO',
    name: 'Glosario médico',
    description:
      'Taxonomía y catálogo curado de términos médicos: 11 categorías, 15 etiquetas y 64 ' +
      'términos con sus designaciones y relaciones.',
    approxRows: 500,
  },
  {
    code: 'ESTABLECIMIENTOS_BO',
    name: 'Establecimientos de salud de Bolivia',
    description:
      'Directorio de establecimientos de Santa Cruz. Es lo que le permite a un profesional ' +
      'decir en qué hospital está de turno y en qué clínica atiende.',
    approxRows: 503,
  },
  {
    code: 'DIRECTORIO_MEDICOS_BO',
    name: 'Directorio de médicos habilitados',
    description:
      'Los médicos de las redes de Alianza y Nacional Seguros, con sus sedes, especialidades y ' +
      'planes. Son fichas de consulta: no traen correo, así que no pueden iniciar sesión.',
    approxRows: 5343,
  },
  {
    code: 'ASEGURADORAS_BO',
    name: 'Aseguradoras de Bolivia',
    description:
      'Las aseguradoras del país con su producto de salud y sus planes. Cada una crea además ' +
      'su propia organización de tipo pagador.',
    approxRows: 50,
  },
  {
    code: 'ARANCEL_BO',
    name: 'Nomenclador de procedimientos',
    description:
      'Arancel de procedimientos médicos y odontológicos con su precio de referencia. Es el ' +
      'paquete más grande: tarda unos segundos.',
    approxRows: 4408,
  },
  {
    code: 'VADEMECUM',
    name: 'Vademécum de medicamentos',
    description:
      'Catálogo de medicamentos para prescribir, con sus principios activos y una matriz de ' +
      'interacciones. Es una muestra de trabajo, no un vademécum clínico completo.',
    approxRows: 241,
  },
  {
    code: 'FORMULARIOS_CLINICOS',
    name: 'Formularios clínicos estándar',
    description:
      'Plantillas de ficha clínica por especialidad, con sus secciones y campos. Cubre las 36 ' +
      'especialidades del catálogo más la anamnesis odontológica.',
    approxRows: 43,
  },
  {
    code: 'CUENTAS_DEMO',
    name: 'Cuentas de demostración',
    description:
      'Cuentas de los socios comerciales —farmacia, laboratorio, imagen y aseguradora— para ' +
      'enseñar el producto. Comparten contraseña a propósito: no protegen nada.',
    approxRows: 4,
    requiresDemoPassword: true,
  },
];

/** El paquete con ese código, o `undefined` si no existe. */
export function buscarPaquete(code: string): ContentPackDefinition | undefined {
  return CONTENT_PACKS.find((paquete) => paquete.code === code);
}
