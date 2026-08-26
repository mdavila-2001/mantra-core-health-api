import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /profiles/practitioners/me/affiliations` (UC-05-16).
 *
 * El sujeto **no viaja**: lo resuelve el backend desde la sesión. Ofrecerlo
 * como parámetro permitiría escribir el currículum de otro.
 */
export class CreateAffiliationDto {
  /**
   * Institución donde ejerció o ejerce.
   */
  @ApiProperty({
    description:
      'Hospital o entidad médica, tal como la declara el profesional',
    example: 'Hospital Obrero N.º 1',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organizationName!: string;

  /**
   * Cargo ejercido.
   */
  @ApiProperty({ description: 'Cargo ejercido', example: 'Médico de planta' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  roleTitle!: string;

  /**
   * Servicio o departamento.
   */
  @ApiPropertyOptional({
    description: 'Servicio o departamento dentro de la institución',
    example: 'Cardiología',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  departmentText?: string;

  /**
   * Sede de la plataforma que corresponde a la institución, si la hay.
   */
  @ApiPropertyOptional({
    description:
      'Sede de la plataforma (`practice.practice_sites`) cuando la institución está dentro. Se omite para instituciones externas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Tipo de vínculo (concept id).
   */
  @ApiPropertyOptional({
    description: 'Tipo de vínculo laboral (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  affiliationTypeConceptId?: string;

  /**
   * Inicio del vínculo.
   */
  @ApiProperty({ description: 'Inicio del vínculo', format: 'date' })
  @IsDateString()
  startDate!: string;

  /**
   * Fin del vínculo. Ausente mientras siga ejerciendo ahí.
   */
  @ApiPropertyOptional({
    description: 'Fin del vínculo. Se omite si sigue ejerciendo ahí',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/** Una afiliación tal como la devuelven la lectura y el alta. */
export class AffiliationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Institución.
   */
  @ApiProperty()
  organizationName!: string;

  /**
   * Cargo.
   */
  @ApiProperty()
  roleTitle!: string;

  /**
   * Servicio o departamento.
   */
  @ApiPropertyOptional({ nullable: true })
  departmentText!: string | null;

  /**
   * Sede de la plataforma, si la institución está dentro.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceSiteId!: string | null;

  /**
   * Tipo de vínculo.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  affiliationTypeConceptId!: string | null;

  /**
   * Inicio del vínculo.
   */
  @ApiProperty({ type: String, format: 'date' })
  startDate!: Date;

  /**
   * Fin del vínculo, o `null` si sigue vigente.
   */
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  endDate!: Date | null;

  /**
   * Si el vínculo sigue vigente. Derivado de `endDate`, para que quien lo lea no
   * tenga que decidir qué significa una fecha ausente.
   */
  @ApiProperty({
    description: 'Derivado de `endDate`: sin fin declarado, sigue vigente',
  })
  current!: boolean;

  /**
   * Estado del registro (concept id).
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * El mismo estado, en algo sobre lo que una pantalla pueda ramificar.
   *
   * El concept id sigue viajando en `status` y es la verdad; esto es una
   * derivación de conveniencia. Existe porque la alternativa era que el
   * frontend comparara uuids escritos a mano, que es exactamente lo que el
   * proyecto prohíbe: los conceptos se resuelven en el servidor.
   *
   * `desconocido` cuando el estado no es ninguno de los tres esperados. Es
   * preferible a suponer: cuando exista el value set de estados —donde entra
   * `declarado`— las pantallas que ya distinguen los casos conocidos no van a
   * mentir sobre el nuevo, van a decir que no lo reconocen.
   */
  @ApiProperty({ enum: ['pendiente', 'aprobado', 'rechazado', 'desconocido'] })
  statusKind!: 'pendiente' | 'aprobado' | 'rechazado' | 'desconocido';

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de `GET /profiles/practitioners/me/affiliations`. */
export class ListAffiliationsResponseDto {
  /**
   * Las afiliaciones, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [AffiliationResponseDto] })
  items!: AffiliationResponseDto[];

  /**
   * Cantidad devuelta.
   */
  @ApiProperty()
  count!: number;
}
