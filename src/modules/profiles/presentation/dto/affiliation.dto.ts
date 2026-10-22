import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
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
   *
   * Opcional desde ALV-007: un vínculo de "atiende en su propio consultorio"
   * no tiene un cargo dentro de una jerarquía, y exigirlo bloqueaba el
   * guardado. Si viene, se usa en perfil/trayectoria; ausente no dibuja hueco.
   */
  @ApiPropertyOptional({
    description: 'Cargo ejercido, cuando aplica',
    example: 'Médico de planta',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  roleTitle?: string;

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
   * Establecimiento del padrón oficial (`VS_BO_HEALTH_FACILITY`) cuando se
   * eligió de la lista. Fuera del padrón responde 422; el mismo establecimiento
   * con el mismo cargo e inicio, 409.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthFacilityConceptId?: string;

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
/**
 * Lo que se puede corregir de una afiliación ya cargada.
 *
 * Es `CreateAffiliationDto` con todo opcional **menos la sede**: la sede decide
 * el estado del vínculo —pendiente, aprobado, declarado— y cambiarla desde la
 * edición sería colarse en una organización sin pasar por su bandeja de
 * solicitudes. Para vincularse a otra sede se carga otra afiliación.
 *
 * `endDate: null` vuelve vigente el vínculo; omitirlo lo deja como estaba.
 */
export class UpdateAffiliationDto extends PartialType(
  OmitType(CreateAffiliationDto, [
    'practiceSiteId',
    'healthFacilityConceptId',
    'endDate',
  ] as const),
) {
  @ApiPropertyOptional({
    description:
      'Fin del vínculo. `null` lo vuelve vigente; omitido, se conserva',
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

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
   * Cargo, cuando el vínculo lo declara.
   */
  @ApiPropertyOptional({ nullable: true })
  roleTitle!: string | null;

  /**
   * Sede de la plataforma, si la institución está dentro.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceSiteId!: string | null;

  /**
   * Establecimiento del padrón oficial, si se eligió de la lista.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  healthFacilityConceptId!: string | null;

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
  @ApiProperty({
    enum: [
      'pendiente',
      'declarado',
      'aprobado',
      'rechazado',
      'revocado',
      'desconocido',
    ],
  })
  statusKind!:
    | 'pendiente'
    | 'declarado'
    | 'aprobado'
    | 'rechazado'
    | 'revocado'
    | 'desconocido';

  /**
   * Por qué la organización rechazó o dio de baja el vínculo.
   *
   * **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es
   * mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee.
   * `null` en cualquier otro estado.
   */
  @ApiPropertyOptional({ type: String, nullable: true })
  decisionReasonText!: string | null;

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
