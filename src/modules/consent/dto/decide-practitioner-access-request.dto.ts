import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export type PractitionerAccessDecision = 'ACCEPTED' | 'DECLINED';

/**
 * Cuerpo de `POST /consent/practitioner-access-requests/:id/decision`
 * (FT-07-R05/R06). Lo manda el PACIENTE.
 */
export class DecidePractitionerAccessRequestDto {
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED'] })
  @IsIn(['ACCEPTED', 'DECLINED'])
  decision!: PractitionerAccessDecision;

  /**
   * FT-07-R06: el paciente elige qué áreas autoriza, no todo-o-nada. Debe ser
   * un subconjunto de lo pedido — el servicio lo valida — y es obligatorio
   * cuando `decision === 'ACCEPTED'`.
   */
  @ApiPropertyOptional({
    description:
      'Subconjunto de las especialidades pedidas que el paciente autoriza. Obligatorio si decision = ACCEPTED.',
    type: [String],
  })
  @ValidateIf(
    (dto: DecidePractitionerAccessRequestDto) => dto.decision === 'ACCEPTED',
  )
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  authorizedSpecialtyConceptIds?: string[];

  /**
   * Cuántos meses dura la autorización desde que se acepta. FT-07 no declara
   * una duración: 12 es el valor por defecto documentado acá y en
   * `PractitionerAccessRequestsService`, no una cifra escondida en el backend.
   */
  @ApiPropertyOptional({
    description: 'Meses de vigencia desde la aceptación (por defecto 12)',
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  validityMonths?: number;
}
