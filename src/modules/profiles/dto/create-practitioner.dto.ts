import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /profiles/practitioners` (UC-05-03): onboarding de fuerza laboral
 * (regla GENERALIST). Incluye la primera licencia jurisdiccional (UC-05-04) y una
 * credencial de soporte (verificable vía UC-05-05).
 */
export class CreatePractitionerDto {
  /**
   * Valor de practitioner code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de profesional (practitioner_code, UK)',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  practitionerCode!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiPropertyOptional({
    description:
      'Persona existente a reutilizar; si se omite se crea una nueva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre visible (si se crea la persona)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string;

  /**
   * Identificador asociado a practitioner category concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de categoría profesional',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practitionerCategoryConceptId?: string;

  /**
   * Valor de professional title mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Título profesional', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professionalTitle?: string;

  /**
   * Las especialidades que el profesional declara al registrarse (TJ-3).
   *
   * Van en el alta y no en una llamada aparte porque el registro es atómico
   * (regla 11 del modelo) y porque la especialidad es lo que la persona tiene
   * presente justo cuando se registra. Cada uuid tiene que ser miembro vigente
   * del catálogo `VS_MEDICAL_SPECIALTY`; uno que no lo sea rechaza el alta
   * entera con 422. La primera de la lista queda como principal.
   *
   * `professionalTitle` sigue existiendo y **no** se alimenta de esto: es texto
   * libre heredado, y mezclarlos volvería a meter especialidades escritas a
   * mano por la puerta de atrás.
   */
  @ApiPropertyOptional({
    description:
      'Especialidades del catálogo VS_MEDICAL_SPECIALTY. La primera es la principal.',
    type: [String],
    format: 'uuid',
    maxItems: 3,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUUID(undefined, { each: true })
  specialtyConceptIds?: string[];

  /**
   * Presentación en prosa del profesional.
   *
   * La columna existía desde el principio (`professional_bio`) y **ninguna
   * escritura la llenaba**: se podía leer y no se podía escribir. Es lo que hace
   * que un perfil profesional se lea como una persona y no como una fila.
   */
  @ApiPropertyOptional({
    description: 'Biografía profesional en prosa',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  professionalBio?: string;

  /**
   * Si toma pacientes nuevos.
   *
   * Nace en `false` cuando no se declara —el alta arranca en onboarding y nadie
   * debería aparecer como disponible antes de estar habilitado— pero tenía que
   * poder declararse: sin esto no había forma de dar de alta a alguien que sí
   * los toma salvo escribiendo en la base.
   */
  @ApiPropertyOptional({
    description: 'Si acepta pacientes nuevos',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptsNewPatients?: boolean;

  /** Si atiende por telemedicina. */
  @ApiPropertyOptional({
    description: 'Si atiende por telemedicina',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  telehealthAvailable?: boolean;

  /**
   * Nº de matrícula, **si se conoce**.
   *
   * Era obligatorio, y el modelo nunca lo pidió: `health_practitioner_profiles`
   * no tiene ninguna columna ni FK que exija una autorización jurisdiccional.
   * La obligatoriedad vivía sólo acá, y forzaba a **inventar una matrícula**
   * para dar de alta a alguien que no la trae — que es justo el caso de una
   * ficha de directorio: el padrón de una aseguradora dice quién atiende, dónde
   * y de qué, pero no publica el número de su matrícula.
   *
   * Sin este valor no se crea la fila de autorización. Es la diferencia entre
   * «no sabemos su matrícula» y «su matrícula es la cadena vacía».
   */
  @ApiPropertyOptional({
    description: 'Nº de licencia de la autorización jurisdiccional inicial',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de jurisdicción de la licencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Valor de regulatory authority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Autoridad regulatoria emisora',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  /**
   * Nº del título de soporte, **si se conoce**. Mismo criterio que la matrícula:
   * sin valor no se crea la credencial, en vez de crear una con número inventado.
   */
  @ApiPropertyOptional({
    description: 'Nº de la credencial de soporte',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  credentialNumber?: string;

  /**
   * Identificador asociado a credential type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de credencial',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  credentialTypeConceptId?: string;

  /**
   * Dónde se cursó la credencial de soporte.
   *
   * Texto libre y no un tenant: la universidad que emitió un título casi nunca
   * es una organización de esta plataforma. La columna
   * (`issuing_institution_text`) existía y ninguna escritura la llenaba, así que
   * la formación se guardaba sin decir dónde se cursó — que es justamente lo que
   * la hace legible en un perfil.
   */
  @ApiPropertyOptional({
    description: 'Institución que emitió la credencial de soporte',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  credentialIssuingInstitutionText?: string;

  /**
   * Cuándo se emitió la credencial de soporte. ISO `YYYY-MM-DD`.
   *
   * Sin fecha, una línea de tiempo de formación no se puede ordenar y se lee
   * como una lista de títulos sueltos.
   */
  @ApiPropertyOptional({
    description: 'Fecha de emisión de la credencial de soporte (ISO)',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  credentialIssueDate?: string;

  /**
   * Identificador asociado a language concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del idioma clínico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;
}

/** Respuesta de onboarding de profesional. */
export class PractitionerResponseDto {
  /**
   * Identificador asociado a profile.
   */
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Valor de practitioner code mantenido por la instancia.
   */
  @ApiProperty()
  practitionerCode!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Valor de practice status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de práctica',
    format: 'uuid',
  })
  practiceStatus!: string;

  /**
   * La autorización creada — **ausente** si el alta no trajo matrícula, que es
   * el caso de una ficha de directorio.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  licenseId?: string;

  /** La credencial creada. Ausente por el mismo motivo que `licenseId`. */
  @ApiPropertyOptional({ format: 'uuid' })
  credentialId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
