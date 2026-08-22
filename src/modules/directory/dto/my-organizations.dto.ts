import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TenantDetailResponseDto } from './directory-read.dto';

/**
 * Datos propios de la aseguradora (`PAYER`), expuestos en la lectura de la
 * organización.
 *
 * Sólo aparece cuando el tenant es de tipo `PAYER`: lo resuelve el servicio
 * de lectura, no este DTO.
 */
export class PayerOrganizationProfileDto {
  /**
   * Código interno de la aseguradora dentro de la plataforma.
   */
  @ApiProperty({ description: 'Código de la aseguradora' })
  carrierCode!: string;

  /**
   * Identificador ante el regulador de seguros (registro, matrícula, NIT).
   */
  @ApiProperty({ description: 'Identificador ante el regulador de seguros' })
  regulatorIdentifier!: string;

  /**
   * Sigla con la que se conoce a la aseguradora.
   */
  @ApiProperty({ description: 'Sigla de la aseguradora' })
  sigla!: string;

  /**
   * Dirección de la aseguradora.
   */
  @ApiProperty({ description: 'Dirección de la aseguradora' })
  address!: string;
}

/**
 * Una organización del actor, con qué puede hacer en ella.
 *
 * ## Por qué el permiso viaja junto a la ficha
 *
 * Porque la pantalla lo necesita para dibujarse: un `org-staff` ve la misma
 * organización que un `org-admin` pero sin los botones de editar ni de invitar.
 * Sin este dato, el panel tendría que adivinar —o pedir permiso probando y
 * comiéndose un 403—, y adivinar termina siempre en botones que fallan.
 *
 * No reemplaza la validación: el servidor vuelve a comprobarlo en cada
 * escritura. Esto es para que la pantalla no mienta, no para autorizar.
 */
export class MyOrganizationDto extends TenantDetailResponseDto {
  /**
   * El rol del actor en esta organización.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto del rol de la membresía activa (owner/admin/staff)',
  })
  myRoleConceptId!: string;

  /**
   * Si puede administrarla: editar sus datos y gestionar su gente.
   */
  @ApiProperty({
    description: 'Verdadero para owner y admin de la organización',
  })
  canAdminister!: boolean;

  /**
   * Si la plataforma ya la aprobó.
   *
   * Viaja resuelto y no sólo como `verificationStatusConceptId` porque el
   * estado es un uuid del catálogo: para saber cuál de todos significa
   * «verificada», la pantalla tendría que atarse a un identificador sembrado.
   * Y le importa: sin aprobar, la organización no aparece en el directorio
   * público, y eso hay que poder decírselo a quien la administra.
   */
  @ApiProperty({
    description: 'Verdadero cuando la plataforma verificó la organización',
  })
  isVerified!: boolean;

  /**
   * Datos propios de la aseguradora. Presente sólo si el tenant es `PAYER`.
   */
  @ApiPropertyOptional({ type: PayerOrganizationProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayerOrganizationProfileDto)
  payer?: PayerOrganizationProfileDto;
}

/**
 * Las organizaciones del actor — respuesta de `GET /tenants/me`.
 *
 * ## Por qué es una lista y no una organización
 *
 * Porque una persona puede pertenecer a más de una: la recepcionista de dos
 * clínicas del mismo grupo, el administrador de una red. Devolver «la» suya
 * obligaría a elegir por ella, y el front ya tiene la pantalla de selección.
 * Con una sola, la lista trae una y la pantalla entra directo.
 *
 * Vacía es una respuesta legítima: quien no pertenece a ninguna organización
 * —un paciente, un médico con consultorio propio— no es un error, simplemente
 * no tiene panel de organización.
 */
export class MyOrganizationsResponseDto {
  /** Sus organizaciones, de la más recientemente creada a la más antigua. */
  @ApiProperty({ type: [MyOrganizationDto] })
  items!: MyOrganizationDto[];
}

/**
 * Datos propios de la aseguradora editables desde `PATCH /tenants/{tenantId}`.
 *
 * `carrierCode` no está acá: no es editable por esta vía.
 */
export class UpdatePayerProfileDto {
  /**
   * Sigla con la que se conoce a la aseguradora.
   */
  @ApiPropertyOptional({ maxLength: 20, example: 'BUPA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sigla?: string;

  /**
   * Dirección de la aseguradora.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  /**
   * Identificador ante el regulador de seguros (registro, matrícula, NIT).
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  regulatorIdentifier?: string;
}

/**
 * Cuerpo de `PATCH /tenants/{tenantId}` — los datos que la organización edita
 * de sí misma.
 *
 * ## Qué NO está acá, y por qué
 *
 * El estado y la verificación no se editan: los mueve la plataforma con
 * `POST /admin/tenants/{id}/verification`. Dejarlos acá convertiría la
 * verificación en una declaración jurada de uno mismo, que es exactamente lo
 * contrario de lo que verificar significa.
 *
 * Tampoco el logo. `directory.tenants` no tiene columna de archivo, y el lugar
 * donde una organización ya tiene imagen es su perfil público
 * (`community.public_profiles.avatar_file_id`), que es además el que se ve en
 * el directorio. Inventar acá una segunda imagen daría dos logos que se
 * contradicen. Se sube por la puerta de siempre —`POST /common/files/upload`—
 * y se asigna en el perfil público de la organización.
 *
 * `PATCH`: lo que no viene no se toca.
 */
export class UpdateTenantDto {
  /**
   * Razón social.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName?: string;

  /**
   * Nombre comercial, el que ve el paciente.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  /**
   * Zona horaria IANA de la organización, p. ej. `America/La_Paz`.
   *
   * No es cosmética: es la zona en la que se leen los horarios de sus agendas.
   */
  @ApiPropertyOptional({ example: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Moneda con la que opera.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Datos propios de la aseguradora. Sólo aplica si el tenant es `PAYER`;
   * si el tenant no tiene aseguradora asociada, este bloque se ignora.
   */
  @ApiPropertyOptional({ type: UpdatePayerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePayerProfileDto)
  payer?: UpdatePayerProfileDto;
}
