import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base of the whole-history responses. When the actor reads under a granular
 * scope, `hiddenByScope` counts, per section, the records the scope kept out,
 * so a client can say «there is more you may not read» instead of «none».
 */
export class ScopedReadResponseDto {
  @ApiPropertyOptional({
    description:
      'Registros que el alcance concedido dejó fuera, por bloque. Ausente cuando se lee la historia completa',
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: { observations: 3 },
  })
  hiddenByScope?: Record<string, number>;
}
