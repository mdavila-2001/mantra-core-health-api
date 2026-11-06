import type { SpanishDesignation } from '../../common/seed/terminology-designations.es';
import { BONE_TYPE } from './clinical.bone-type.concepts';

/**
 * Nombre y explicación en castellano de los tipos de hueso de una orden de imagen
 * (value set `bone-type`). Es la clasificación anatómica clásica; la procedencia
 * de cada clase (UBERON, FMA) la registra el parche v4294 del modelo. El médico
 * elige el tipo: estos textos explican las opciones, no las deducen.
 *
 * Se esparce en `ENTRIES` de `terminology-designations.es.ts`.
 */
export const BONE_TYPE_SPANISH_DESIGNATION_ENTRIES: readonly (readonly [
  string,
  SpanishDesignation,
])[] = [
  [
    BONE_TYPE.BONE_TYPE_LONG,
    {
      display: 'Hueso largo',
      definition:
        'Hueso más largo que ancho, con un cuerpo central y dos extremos. Por ejemplo, el fémur o el húmero.',
    },
  ],
  [
    BONE_TYPE.BONE_TYPE_SHORT,
    {
      display: 'Hueso corto',
      definition:
        'Hueso de forma parecida a un cubo, con largo y ancho similares. Por ejemplo, los huesos de la muñeca y del tobillo.',
    },
  ],
  [
    BONE_TYPE.BONE_TYPE_FLAT,
    {
      display: 'Hueso plano',
      definition:
        'Hueso delgado y aplanado que protege órganos o sirve de superficie a los músculos. Por ejemplo, el esternón, las costillas o los huesos del cráneo.',
    },
  ],
  [
    BONE_TYPE.BONE_TYPE_IRREGULAR,
    {
      display: 'Hueso irregular',
      definition:
        'Hueso de forma compleja que no encaja en las otras clases. Por ejemplo, las vértebras.',
    },
  ],
  [
    BONE_TYPE.BONE_TYPE_SESAMOID,
    {
      display: 'Hueso sesamoideo',
      definition:
        'Hueso pequeño que se forma dentro de un tendón. El más conocido es la rótula.',
    },
  ],
];
