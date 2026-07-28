import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /community/reports` (UC-19-08). */
export class CreateReportDto {
  /**
   * Valor de target type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de contenido reportado',
    enum: ['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'])
  targetType!: 'POST' | 'COMMENT' | 'PROFILE' | 'MESSAGE' | 'REVIEW';

  /**
   * Identificador asociado a target.
   */
  @ApiProperty({ description: 'Id del contenido reportado', format: 'uuid' })
  @IsUUID()
  targetId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Motivo',
    enum: ['SPAM', 'ABUSE', 'MISINFORMATION', 'PHI', 'OTHER'],
  })
  @IsIn(['SPAM', 'ABUSE', 'MISINFORMATION', 'PHI', 'OTHER'])
  reason!: 'SPAM' | 'ABUSE' | 'MISINFORMATION' | 'PHI' | 'OTHER';

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalle libre', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detailText?: string;
}
