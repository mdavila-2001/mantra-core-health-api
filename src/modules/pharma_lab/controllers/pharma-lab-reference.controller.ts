import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PHARMA_LAB_CONCEPT_SEEDS } from '../pharma_lab.concepts';
import { deterministicId } from '../../../common/constants/concepts';

/** Un concepto del módulo, tal como lo consume la interfaz. */
export interface PharmaLabConcept {
  /** Nombre lógico dentro del módulo (`VISIT_CONFIRMED`, `LAB_ACTIVE`…). */
  key: string;
  /** Identificador con el que viaja en cualquier `*_concept_id`. */
  id: string;
  /** Código estable del catálogo. */
  code: string;
  /** Rótulo legible en español. */
  display: string;
}

/**
 * Diccionario de conceptos del carril 17.
 *
 * Existe porque el resto de la API devuelve `*_concept_id` como UUID, y sin esto
 * la interfaz tendría que **recalcular el UUID determinista** duplicando la
 * función de derivación en TypeScript del navegador — dos implementaciones de la
 * misma regla que se separan en cuanto una cambia—, o pintar el identificador en
 * crudo, que no le dice nada a nadie.
 *
 * Es de solo lectura y no expone dato de negocio: es el vocabulario del módulo.
 */
@ApiTags('pharma-lab-reference')
@ApiBearerAuth()
@Controller('pharma-labs/reference')
export class PharmaLabReferenceController {
  /** Vocabulario completo del módulo, con su identificador y su rótulo. */
  @Get('concepts')
  @ApiOperation({
    summary: 'Diccionario de conceptos del laboratorio farmacéutico',
    description:
      'Traduce cada `*_concept_id` del módulo a su código y su rótulo legible.',
  })
  listConcepts(): PharmaLabConcept[] {
    return PHARMA_LAB_CONCEPT_SEEDS.map((seed) => ({
      // La clave del seed viaja con el prefijo del módulo; la interfaz solo
      // necesita el nombre lógico.
      key: seed.key.replace(/^pharma_lab:/, ''),
      id: deterministicId(seed.key),
      code: seed.code,
      display: seed.display,
    }));
  }
}
