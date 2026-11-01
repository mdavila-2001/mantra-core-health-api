import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ISSUE_STATUSES,
  MAX_PAGE_SIZE,
  SEVERITIES,
} from '../governance_admin.constants';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class PageQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor opaco (`nextCursor`)',
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}

export class IssuesQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ISSUE_STATUSES })
  @IsOptional()
  @IsIn(ISSUE_STATUSES)
  status?: (typeof ISSUE_STATUSES)[number];

  @ApiPropertyOptional({ enum: SEVERITIES })
  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: (typeof SEVERITIES)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({
    description:
      'Busca en la ruta del campo, el código y el nombre de la regla',
    maxLength: 120,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class RulesQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: SEVERITIES })
  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: (typeof SEVERITIES)[number];

  @ApiPropertyOptional({
    description: 'Código de la dimensión de calidad (concepto)',
    maxLength: 80,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(80)
  dimension?: string;

  @ApiPropertyOptional({
    description: 'Busca en código y nombre',
    maxLength: 120,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class IdParamDto {
  @IsUUID()
  id!: string;
}
