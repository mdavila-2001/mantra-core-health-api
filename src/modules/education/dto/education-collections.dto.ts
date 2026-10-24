import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de cursos (V47-08). */
export class CourseItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid' })
  courseTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  specialtyConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  levelConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  languageConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  coverFileId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isAccredited!: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  cmeCreditHours!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  accreditingBodyConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  price!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  durationMinutes!: number | null;

  @ApiProperty({ type: Number })
  currentVersion!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de cursos. */
export class ListCoursesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de cursos. */
export class CoursePageDto extends pageResponseOf(
  CourseItemDto,
  'CoursePageDto',
) {}
