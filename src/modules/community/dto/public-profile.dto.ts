import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Tipos de sujeto que un perfil público puede representar. */
export type ProfileTargetType = 'USER' | 'PRACTITIONER' | 'ORGANIZATION';

/**
 * Cuerpo de `POST /community/public-profiles`. Endpoint de bootstrap: proyecta un
 * usuario/paciente/organización (id de otro módulo, vía DTO) como perfil público,
 * nodo raíz al que apuntan las FK sociales del módulo.
 */
export class CreatePublicProfileDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant propietario', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a target.
   */
  @ApiProperty({
    description: 'Id del sujeto proyectado (user/patient/org de otro módulo)',
    format: 'uuid',
  })
  @IsUUID()
  targetId!: string;

  /**
   * Valor de target type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de sujeto',
    enum: ['USER', 'PRACTITIONER', 'ORGANIZATION'],
  })
  @IsOptional()
  @IsIn(['USER', 'PRACTITIONER', 'ORGANIZATION'])
  targetType?: ProfileTargetType;

  /**
   * Valor de slug mantenido por la instancia.
   */
  @ApiProperty({ description: 'Slug único legible', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre visible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Valor de headline mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  /**
   * Valor de biography mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  biography?: string;

  /**
   * Visibilidad de la vitrina.
   *
   * Omitirla la deja privada, igual que en `PUT /community/profiles/me`. El
   * alta de una vitrina **no publica a nadie por omisión**: publicarse en un
   * directorio abierto es una decisión, no el efecto secundario de un alta.
   *
   * Antes este endpoint no la escribía en absoluto, así que todo perfil creado
   * por el bootstrap quedaba con la columna nula y **jamás aparecía en el
   * directorio público** — que compara por igualdad contra `PUBLIC`, no por
   * «distinto de privado». Es lo que dejaba el buscador de P4 sirviendo un
   * directorio vacío sin que nada fallara.
   */
  @ApiPropertyOptional({
    description: 'Visibilidad de la vitrina; omitirla la deja privada',
    enum: ['PUBLIC', 'PRIVATE'],
  })
  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  /**
   * Valor de accepts reviews mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Acepta reviews de servicio' })
  @IsOptional()
  @IsBoolean()
  acceptsReviews?: boolean;
}
