import type { ServiceKind } from './surveys-standard.catalog';

/**
 * El tipo de servicio (`ServiceKind` del catálogo estándar) de un servicio del
 * catálogo de facturación, para sugerir qué encuesta estándar importarle.
 *
 * ## De dónde sale
 *
 * `billing.service_catalog` no tiene una columna de tipo o categoría: cada
 * servicio se da de alta desde el repositorio universal de servicios
 * (`ServiceRepositoryService`), que copia su **nombre** de la designación del
 * concepto (CUPS, FONASA, PAMI, arancel boliviano, curación propia). Ese
 * nombre es lo único que clasifica al servicio con datos del servidor, así que
 * el tipo se deriva de él con las reglas de abajo, sin distinguir mayúsculas ni
 * tildes. Es una **sugerencia**: orienta la elección de plantilla, no la
 * restringe (`serviceKinds` del catálogo tampoco restringe).
 *
 * ## Reglas, en orden (gana la primera que coincide)
 *
 * | Tipo | El nombre contiene |
 * |---|---|
 * | `TELEMEDICINE` | telemedicina, teleconsulta, telesalud, consulta virtual, videoconsulta |
 * | `HOME_CARE` | domicilio, domiciliaria/o |
 * | `PHARMACY` | farmacia, farmacéutica/o, dispensación |
 * | `IMAGING` | ecografía, ultrasonido, radiografía, rayos x, tomografía, resonancia, mamografía, densitometría, doppler, ecocardiograma, fluoroscopía, gammagrafía, imagen, imagenología |
 * | `LAB` | laboratorio, análisis, hemograma, cultivo, perfil, dosaje, dosificación, glucosa, colesterol, orina, heces, serología, examen de sangre, prueba de, citología, papanicolaou |
 * | `THERAPY` | terapia, fisioterapia, kinesiología, rehabilitación, psicoterapia, fonoaudiología, sesión, masaje, logopedia |
 * | `PROCEDURE` | cirugía, quirúrgica/o, procedimiento, biopsia, extracción, sutura, endoscopía, colonoscopía, infiltración, curación, drenaje, punción, cateterismo, implante, resección, -ectomía, -otomía, -plastia, -scopía |
 * | `CONSULTATION` | consulta, control, valoración, evaluación, chequeo, atención médica |
 * | `OTHER` | ninguna de las anteriores |
 *
 * El orden importa: «Consulta de telemedicina» es telemedicina y «Control de
 * laboratorio», laboratorio; las palabras de consulta van al final porque casi
 * todo servicio las usa de paso.
 */
const RULES: readonly (readonly [ServiceKind, readonly RegExp[]])[] = [
  [
    'TELEMEDICINE',
    [
      /telemedicina/,
      /teleconsulta/,
      /telesalud/,
      /consulta virtual/,
      /videoconsulta/,
    ],
  ],
  ['HOME_CARE', [/domicili/]],
  ['PHARMACY', [/farmac/, /dispensaci/]],
  [
    'IMAGING',
    [
      /ecograf/,
      /ultrasonid/,
      /radiograf/,
      /rayos x/,
      /tomograf/,
      /resonancia/,
      /mamograf/,
      /densitometr/,
      /doppler/,
      /ecocardiogra/,
      /fluoroscop/,
      /gammagraf/,
      /imagen/,
    ],
  ],
  [
    'LAB',
    [
      /laboratorio/,
      /analisis/,
      /hemograma/,
      /cultivo/,
      /\bperfil\b/,
      /dosaje/,
      /dosificacion/,
      /glucosa/,
      /colesterol/,
      /\borina\b/,
      /\bheces\b/,
      /serolog/,
      /examen de sangre/,
      /prueba de/,
      /citolog/,
      /papanicolaou/,
    ],
  ],
  [
    'THERAPY',
    [
      /terapia/,
      /kinesiolog/,
      /rehabilitacion/,
      /fonoaudiolog/,
      /\bsesion/,
      /masaje/,
      /logopedia/,
    ],
  ],
  [
    'PROCEDURE',
    [
      /cirugia/,
      /quirurgic/,
      /procedimiento/,
      /biopsia/,
      /extraccion/,
      /sutura/,
      /endoscop/,
      /colonoscop/,
      /infiltracion/,
      /curacion/,
      /drenaje/,
      /puncion/,
      /cateterismo/,
      /implante/,
      /reseccion/,
      /ectomia\b/,
      /otomia\b/,
      /plastia\b/,
      /scopia\b/,
    ],
  ],
  [
    'CONSULTATION',
    [
      /consulta/,
      /\bcontrol\b/,
      /valoracion/,
      /evaluacion/,
      /chequeo/,
      /atencion medica/,
    ],
  ],
];

/** Minúsculas y sin tildes, para comparar nombres en castellano. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * El tipo de un servicio según su nombre.
 *
 * @param serviceName - Nombre del servicio en el catálogo de facturación.
 * @returns El tipo; `OTHER` si ninguna regla coincide.
 */
export function serviceKindOf(
  serviceName: string | null | undefined,
): ServiceKind {
  const name = normalize(serviceName ?? '');
  for (const [kind, patterns] of RULES) {
    if (patterns.some((pattern) => pattern.test(name))) return kind;
  }
  return 'OTHER';
}
