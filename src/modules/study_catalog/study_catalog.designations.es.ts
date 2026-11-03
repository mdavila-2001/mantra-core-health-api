import type { SpanishDesignation } from '../../common/seed/terminology-designations.es';
import imaging from './data/imagenologia.json';
import {
  STUDY,
  bodySiteConceptId,
  modalityConceptId,
} from './study_catalog.concepts';

/**
 * Nombre y explicación en castellano de los conceptos que el catálogo de estudios
 * publica como opciones (modalidades, regiones, contraste).
 *
 * El texto sale de `data/imagenologia.json` —nombre del catálogo, código DICOM y
 * clase de región— sin agregar nada que el catálogo no diga. Los nombres en
 * castellano del catálogo están pendientes de revisión clínica
 * (`PENDIENTES-CLINICOS.md`, fila (g)): no son traducción oficial de DICOM.
 *
 * Se esparce en `ENTRIES` de `terminology-designations.es.ts`.
 */

const REGION_KIND: Record<string, string> = {
  grupo: 'Grupo de regiones',
  region: 'Región anatómica',
  vascular: 'Territorio vascular',
  combinada: 'Región combinada',
};

export const STUDY_CATALOG_SPANISH_DESIGNATION_ENTRIES: readonly (readonly [
  string,
  SpanishDesignation,
])[] = [
  ...imaging.modalidades.map(
    (m) =>
      [
        modalityConceptId(m.codigo),
        {
          display: m.nombre,
          definition: `Modalidad de adquisición de imagen «${m.nombre}» (DICOM ${m.dicom}, PS3.16 CID 29).`,
        },
      ] as const,
  ),
  ...imaging.regiones.map(
    (r) =>
      [
        bodySiteConceptId(r.codigo),
        {
          display: r.nombre,
          definition: `${REGION_KIND[r.tipo] ?? 'Región'} «${r.nombre}» del catálogo de imagenología (DICOM PS3.16 Anexo L, parte del cuerpo ${r.dicom_body_part}).`,
        },
      ] as const,
  ),
  [
    STUDY.CONTRAST_NONE,
    {
      display: 'Sin contraste',
      definition:
        'El estudio de imagen se hace sin administrar medio de contraste.',
    },
  ],
  [
    STUDY.CONTRAST_WITH,
    {
      display: 'Con contraste',
      definition:
        'El estudio de imagen se hace con medio de contraste; la vía de administración depende del estudio.',
    },
  ],
  [
    STUDY.CONTRAST_WITH_AND_WITHOUT,
    {
      display: 'Sin y con contraste',
      definition:
        'El estudio de imagen incluye una fase sin contraste y otra con medio de contraste.',
    },
  ],
];
