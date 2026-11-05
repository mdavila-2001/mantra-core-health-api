import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  AvailabilityProductDto,
  AvailabilitySiteDto,
} from './read-responses.dto';

/**
 * Disponibilidad **por medicamento** (`GET /pharmacy-inventory/availability/medications`).
 *
 * La lectura por producto pregunta por ids concretos, y cada id pertenece a
 * una sola farmacia: una receta no conoce productos, conoce medicamentos del
 * vademécum. Esta lectura parte de esos medicamentos y busca en **toda la
 * red**: cualquier producto publicado de cualquier farmacia visible que
 * responda a cada medicamento, con la misma regla de existencias por sede.
 */

/** El producto con que una sede surte un medicamento solicitado. */
export class MedicationAvailabilityProductDto extends AvailabilityProductDto {
  /** El medicamento del vademécum (`medication_concept_id`) al que responde. */
  @ApiProperty({ format: 'uuid' })
  medicationConceptId!: string;
}

/**
 * Una sede candidata, evaluada por medicamento. Si la sede tiene varios
 * productos disponibles del mismo medicamento, ofrece **uno**: el de menor
 * precio para el paciente (sin precio, al final; a igualdad, por código).
 */
export class MedicationAvailabilitySiteDto extends OmitType(
  AvailabilitySiteDto,
  ['missingProductIds', 'products'] as const,
) {
  /**
   * Los medicamentos solicitados que esta sede NO tiene disponibles. Aquí
   * `complete` es «tiene todos los medicamentos», y `availableCount` cuenta
   * medicamentos, no productos.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  missingMedicationConceptIds!: string[];

  /**
   * Un producto por medicamento que la sede tiene disponible, en el orden de
   * la consulta. Es el que un pedido a esta sede tiene que llevar: un
   * producto de otra farmacia no se puede pedir aquí.
   */
  @ApiProperty({ type: [MedicationAvailabilityProductDto] })
  products!: MedicationAvailabilityProductDto[];
}

/** La respuesta por medicamento: sedes candidatas, ya ordenadas. */
export class MedicationAvailabilityResponseDto {
  /** Los medicamentos consultados, tal como llegaron (deduplicados). */
  @ApiProperty({ type: [String], format: 'uuid' })
  requestedMedicationConceptIds!: string[];

  /**
   * Los consultados para los que ninguna farmacia visible publica un
   * producto vendible: ninguna sede los puede confirmar.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  unpublishedMedicationConceptIds!: string[];

  /**
   * Sedes de cualquier farmacia de la red con al menos un medicamento
   * disponible. Orden: las que tienen todos primero; después por distancia
   * ascendente (si la consulta trajo coordenadas; sin coordenadas van al
   * final); después por total ascendente (sin total al final); después por
   * nombre.
   */
  @ApiProperty({ type: [MedicationAvailabilitySiteDto] })
  items!: MedicationAvailabilitySiteDto[];

  /** Cantidad de sedes servidas. */
  @ApiProperty()
  count!: number;
}
