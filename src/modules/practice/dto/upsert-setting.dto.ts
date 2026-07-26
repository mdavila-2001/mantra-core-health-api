import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `PUT /practices/{practiceId}/settings/{settingKey}` (UC-14-07). */
export class UpsertSettingDto {
  @ApiProperty({ description: 'Valor del ajuste (JSON arbitrario)', type: Object })
  @IsDefined()
  valueJson!: unknown;

  @ApiPropertyOptional({ description: 'Concepto de categoría del ajuste', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;
}
