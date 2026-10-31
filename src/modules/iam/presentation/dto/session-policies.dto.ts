import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const SCOPES = ['ALL_ACCOUNTS', 'ORG_STAFF', 'ROLE'] as const;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Franja horaria permitida. */
export class AllowedHoursDto {
  /** Días permitidos (0 = domingo … 6 = sábado); omitido = todos. */
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days?: number[];

  /** Hora de inicio `HH:mm`. */
  @ApiProperty({ example: '07:00' })
  @Matches(HHMM)
  from!: string;

  /** Hora de fin `HH:mm`. */
  @ApiProperty({ example: '20:00' })
  @Matches(HHMM)
  to!: string;

  /** Zona horaria IANA; por defecto La Paz. */
  @ApiPropertyOptional({ example: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;
}

/** Una política de sesión de la organización. */
export class SessionPolicyDto {
  /** A quién alcanza. */
  @ApiProperty({ enum: SCOPES })
  @IsIn(SCOPES)
  scope!: (typeof SCOPES)[number];

  /** Rol, obligatorio con alcance `ROLE`. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  roleCode?: string;

  /** Minutos de inactividad antes de cerrar la sesión (5-1440). */
  @ApiProperty({ minimum: 5, maximum: 1440 })
  @IsInt()
  @Min(5)
  @Max(1440)
  idleTimeoutMinutes!: number;

  /** Avisar de un dispositivo nuevo. */
  @ApiProperty()
  @IsBoolean()
  newDeviceAlert!: boolean;

  /** Horario permitido. */
  @ApiPropertyOptional({ type: AllowedHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AllowedHoursDto)
  allowedHours?: AllowedHoursDto;

  /** Hacer cumplir las reglas de IP. */
  @ApiProperty()
  @IsBoolean()
  enforceIpRules!: boolean;

  /** Exigir segundo factor. */
  @ApiProperty()
  @IsBoolean()
  requireMfa!: boolean;
}

/** Cuerpo de `PUT /org/session-policies`: el conjunto completo de políticas. */
export class PutSessionPoliciesDto {
  /** Políticas de la organización; reemplazan a las anteriores. */
  @ApiProperty({ type: [SessionPolicyDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SessionPolicyDto)
  policies!: SessionPolicyDto[];
}

/** Políticas de sesión de la organización. */
export class SessionPoliciesResponseDto {
  /** Políticas vigentes. */
  @ApiProperty({ type: [SessionPolicyDto] })
  policies!: SessionPolicyDto[];
}
