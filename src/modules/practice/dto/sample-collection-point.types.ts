import type { BedBoardCell } from './care-space-ops.types';

/** Un punto de toma de muestras de una sede (`GET /sites/:siteId/sample-collection-points`). */
export interface SampleCollectionPointView {
  readonly careSpace: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly path: BedBoardCell['path'];
  };
  /** Unidad (Laboratorio) a la que pertenece, si la tiene. */
  readonly unit: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
  } | null;
  /** Estado operativo del espacio (F2), sin datos de paciente ni texto clínico. */
  readonly cell: BedBoardCell;
}
