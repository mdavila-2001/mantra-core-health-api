import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const TEMPLATE_AUDIENCES = [
  'PATIENT',
  'PRACTITIONER',
  'HEALTH_FACILITY',
  'LABORATORY',
  'PHARMACY',
  'INSURER',
] as const;
export const REPORT_COLUMNS = {
  TRIAL_BALANCE: ['code', 'name', 'debit', 'credit', 'balance'],
  GENERAL_LEDGER: [
    'transactionNumber',
    'transactionDate',
    'memo',
    'debit',
    'credit',
    'runningBalance',
  ],
  INCOME_STATEMENT: ['code', 'name', 'amount'],
} as const;
export type ReportKind = keyof typeof REPORT_COLUMNS;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ReportTemplateColumnDto {
  @ApiProperty({ maxLength: 64 }) @IsString() @MaxLength(64) key!: string;
  @ApiProperty({ maxLength: 80 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;
}

export class ReportTemplatePresentationDto {
  @ApiProperty({ maxLength: 160 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;
  @ApiProperty({ enum: Object.keys(REPORT_COLUMNS) })
  @IsIn(Object.keys(REPORT_COLUMNS))
  reportKind!: ReportKind;
  @ApiProperty({ type: [ReportTemplateColumnDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ReportTemplateColumnDto)
  columns!: ReportTemplateColumnDto[];
}

export class CreateReportTemplateDto extends ReportTemplatePresentationDto {
  @ApiProperty({ enum: TEMPLATE_AUDIENCES })
  @IsIn(TEMPLATE_AUDIENCES)
  userType!: (typeof TEMPLATE_AUDIENCES)[number];
  @ApiProperty({ pattern: '^[A-Z][A-Z0-9_]{1,79}$' })
  @Matches(/^[A-Z][A-Z0-9_]{1,79}$/)
  code!: string;
}

export class UpdateReportTemplateDto extends ReportTemplatePresentationDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) expectedRowVersion!: number;
  @ApiProperty() @IsBoolean() isActive!: boolean;
}

export class EndReportTemplateDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) expectedRowVersion!: number;
}

export class ReportTemplateQueryDto {
  @ApiPropertyOptional({ enum: TEMPLATE_AUDIENCES })
  @IsOptional()
  @IsIn(TEMPLATE_AUDIENCES)
  userType?: (typeof TEMPLATE_AUDIENCES)[number];
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  after?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ReportTemplateResponseDto extends ReportTemplatePresentationDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: TEMPLATE_AUDIENCES })
  userType!: (typeof TEMPLATE_AUDIENCES)[number];
  @ApiProperty() code!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() rowVersion!: number;
}

export class ReportTemplateListDto {
  @ApiProperty({ type: [ReportTemplateResponseDto] })
  items!: ReportTemplateResponseDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}
