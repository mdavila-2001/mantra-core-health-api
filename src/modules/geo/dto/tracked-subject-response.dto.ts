import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública de un sujeto rastreado (UC-13-01). */
export class TrackedSubjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiProperty({ description: 'Concept id del tipo de sujeto', format: 'uuid' })
  subjectType!: string;

  @ApiProperty({
    description: 'Concept id del estado del sujeto',
    format: 'uuid',
  })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
