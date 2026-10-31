import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const RULE_TYPES = ['ALLOW', 'DENY'] as const;

/** Una regla de red de la organización. */
export class IpAccessRuleDto {
  /** `ALLOW`: solo se entra desde estos rangos; `DENY`: desde estos no se entra. */
  @ApiProperty({ enum: RULE_TYPES })
  @IsIn(RULE_TYPES)
  type!: (typeof RULE_TYPES)[number];

  /** Rango en CIDR: `190.129.0.0/16`, `203.0.113.7/32`, `2001:db8::/32`. */
  @ApiProperty({ example: '190.129.0.0/16' })
  @IsString()
  @MaxLength(64)
  cidr!: string;

  /** Para qué existe la regla («Red de la sede central»). */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  /** Desde cuándo rige. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /** Hasta cuándo rige. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `PUT /org/ip-access-rules`: el conjunto completo de la organización. */
export class PutIpAccessRulesDto {
  /** Reglas nuevas; reemplazan a las vigentes. Vacío = sin restricción de red. */
  @ApiProperty({ type: [IpAccessRuleDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => IpAccessRuleDto)
  rules!: IpAccessRuleDto[];
}

/** Una regla vigente con su identificador. */
export class IpAccessRuleViewDto extends IpAccessRuleDto {
  /** Identificador de la regla. */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Reglas de red de la organización. */
export class IpAccessRulesResponseDto {
  /** Reglas activas, en el orden en que se guardaron. */
  @ApiProperty({ type: [IpAccessRuleViewDto] })
  rules!: IpAccessRuleViewDto[];
}

/** Lo que el servidor ve del origen de la petición, para escribir reglas de red con él. */
export class MyNetworkDto {
  /** IP contra la que se evalúan las reglas de red; `null` si el servidor no pudo leerla. */
  @ApiProperty({ type: String, nullable: true, example: '190.129.4.20' })
  ip!: string | null;

  /** Familia de la dirección. */
  @ApiProperty({ enum: ['ipv4', 'ipv6'], nullable: true })
  family!: 'ipv4' | 'ipv6' | null;

  /**
   * Saltos de proxy de confianza con los que corre el servidor
   * (`TRUST_PROXY_HOPS`). Con `0` detrás de un proxy, la IP es la del proxy.
   */
  @ApiProperty({ minimum: 0 })
  trustProxyHops!: number;
}
