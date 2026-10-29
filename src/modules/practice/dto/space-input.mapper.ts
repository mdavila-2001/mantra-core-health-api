import { PreconditionFailedException } from '../../../common';
import { FUNCTIONS } from '../infrastructure-catalog';
import { PracticeErrorReason } from '../practice.error-reasons';
import type { SpaceInput } from '../services/care-space-creation.service';
import type { CreateCareSpaceDto } from './create-care-space.dto';

/**
 * Cuerpo del alta → entrada del servicio.
 *
 * `spaceTypeConceptId` es el campo de los clientes anteriores a F1 (id de
 * concepto de función): se traduce al código; `functionCode` manda si vienen los
 * dos.
 *
 * @param dto - Cuerpo validado.
 * @returns La entrada del servicio.
 * @throws PreconditionFailedException (422) si el id heredado no es una función conocida.
 */
export function toSpaceInput(dto: CreateCareSpaceDto): SpaceInput {
  let functionCode = dto.functionCode;
  if (!functionCode && dto.spaceTypeConceptId) {
    const legacy = FUNCTIONS.byConceptId(dto.spaceTypeConceptId);
    if (!legacy) {
      throw new PreconditionFailedException(
        'spaceTypeConceptId no es una función de espacio conocida',
        {
          errors: [
            {
              field: 'spaceTypeConceptId',
              reason: PracticeErrorReason.CATALOG_CODE_INVALID,
            },
          ],
        },
        PracticeErrorReason.CATALOG_CODE_INVALID,
      );
    }
    functionCode = legacy.code;
  }
  const { spaceTypeConceptId: _legacy, functionCode: _fn, ...rest } = dto;
  return { ...rest, functionCode };
}
