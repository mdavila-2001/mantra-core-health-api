import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/** Cuerpo de `POST /iam/me/step-up`: el código vigente de su app autenticadora. */
export class StepUpDto {
  /** Código vigente de un factor ya confirmado; es de un solo uso. */
  @ApiProperty({ example: '123456', minLength: 6, maxLength: 8 })
  @IsString()
  @Length(6, 8)
  code!: string;
}

/** Resultado de un paso extra verificado. */
export class StepUpResultDto {
  /** Cuándo se verificó. */
  @ApiProperty({ type: String, format: 'date-time' })
  verifiedAt!: Date;

  /** Minutos que el sello queda guardado para la sesión. */
  @ApiProperty({ example: 60 })
  validForMinutes!: number;
}

/** Parámetros de `GET /iam/me/step-up`. */
export class StepUpStatusQueryDto {
  /** Edad máxima con la que el sello cuenta como fresco (1-60, por defecto 10). */
  @ApiPropertyOptional({ minimum: 1, maximum: 60, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  maxAgeMinutes?: number;
}

/** Estado del paso extra de la sesión en curso. */
export class StepUpStatusDto {
  /** ¿Hay un sello con la edad pedida o menos? */
  @ApiProperty()
  fresh!: boolean;

  /** Minutos desde el último paso extra; `null` si la sesión no tiene sello vigente. */
  @ApiProperty({ type: Number, nullable: true })
  ageMinutes!: number | null;
}
