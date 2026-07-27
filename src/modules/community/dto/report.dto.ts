import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /community/reports` (UC-19-08). */
export class CreateReportDto {
  @ApiProperty({
    description: 'Tipo de contenido reportado',
    enum: ['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'])
  targetType!: 'POST' | 'COMMENT' | 'PROFILE' | 'MESSAGE' | 'REVIEW';

  @ApiProperty({ description: 'Id del contenido reportado', format: 'uuid' })
  @IsUUID()
  targetId!: string;

  @ApiProperty({
    description: 'Motivo',
    enum: ['SPAM', 'ABUSE', 'MISINFORMATION', 'PHI', 'OTHER'],
  })
  @IsIn(['SPAM', 'ABUSE', 'MISINFORMATION', 'PHI', 'OTHER'])
  reason!: 'SPAM' | 'ABUSE' | 'MISINFORMATION' | 'PHI' | 'OTHER';

  @ApiPropertyOptional({ description: 'Detalle libre', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detailText?: string;
}
