import { BULK_IMPORT_PERMISSIONS } from '../bulk-import.constants';
import {
  PERSON_NAME_PART_MAX_LENGTH,
  PHONE_MAX_LENGTH,
} from '../../../common/constants/person-field-limits';
import { BIRTH_DATE_MIN } from '../../iam/presentation/dto/register-patient.dto';
import {
  ADMIN_GENDER_CODES,
  BIRTH_SEX_CODES,
} from '../../profiles/profiles.concepts';
import type { FieldSpec, KindSchema } from './field-schema';

/**
 * Altas masivas de usuarios, por tipo de alta.
 *
 * Los campos obligatorios salen de los DTO de registro existentes (cada columna
 * cita su `source`). Tres decisiones que **no** son del archivo:
 *
 * - **Sin contraseña.** `RegisterPatientDto`/`RegisterPractitionerDto` la exigen
 *   porque el titular se registra solo; una carga administrativa sigue el
 *   camino `assisted-*` (C-18): la cuenta nace pendiente y el titular activa la
 *   suya con un token de un solo uso. Una contraseña en un archivo sería un
 *   secreto en reposo.
 * - **Sin roles privilegiados.** `clinicalRoles` (alta asistida de profesional),
 *   `initialRole: SECURITY_ADMIN` y la membresía `OWNER` no se pueden conceder
 *   por archivo: son decisiones de gobierno de permisos (H5), no de una carga.
 * - **El motivo del alta** (`reason`, obligatorio en las altas asistidas) viaja
 *   en la declaración del lote, no repetido por fila.
 */

const IAM_PATIENT =
  'src/modules/iam/presentation/dto/register-patient.dto.ts#RegisterPatientDto';
const IAM_PRACTITIONER =
  'src/modules/iam/presentation/dto/register-practitioner.dto.ts#RegisterPractitionerDto';
const IAM_CREATE_USER =
  'src/modules/iam/presentation/dto/create-user.dto.ts#CreateUserDto';
const DIR_MEMBERSHIP =
  'src/modules/directory/dto/create-membership.dto.ts#CreateMembershipDto';

const NATIONAL_ID_PATTERN = /^[A-Za-z0-9.-]+$/;
const NATIONAL_ID_HINT = 'Sólo admite letras, dígitos, punto y guion';
const SYNTHETIC_UUID_1 = '00000000-0000-4000-8000-000000000001';
const SYNTHETIC_UUID_2 = '00000000-0000-4000-8000-000000000002';

function nameFields(sourcePrefix: string): FieldSpec[] {
  return [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Nombre de pila',
      example: 'Persona',
      source: `${sourcePrefix}.name`,
      min: 1,
      max: PERSON_NAME_PART_MAX_LENGTH,
      sensitive: true,
    },
    {
      name: 'middleName',
      type: 'string',
      required: false,
      description: 'Segundo nombre',
      example: 'Prueba',
      source: `${sourcePrefix}.middleName`,
      max: PERSON_NAME_PART_MAX_LENGTH,
      sensitive: true,
    },
    {
      name: 'lastName',
      type: 'string',
      required: true,
      description: 'Apellido paterno',
      example: 'Sintetico',
      source: `${sourcePrefix}.lastName`,
      min: 1,
      max: PERSON_NAME_PART_MAX_LENGTH,
      sensitive: true,
    },
    {
      name: 'motherLastName',
      type: 'string',
      required: false,
      description: 'Apellido materno',
      example: 'Demo',
      source: `${sourcePrefix}.motherLastName`,
      max: PERSON_NAME_PART_MAX_LENGTH,
      sensitive: true,
    },
  ];
}

function nationalIdField(source: string): FieldSpec {
  return {
    name: 'nationalId',
    type: 'string',
    required: true,
    description:
      'Documento de identidad (se guarda como identificador oficial). Sólo letras, dígitos, punto y guion',
    example: 'SINT-0001',
    source,
    min: 4,
    max: 40,
    pattern: NATIONAL_ID_PATTERN,
    patternHint: NATIONAL_ID_HINT,
    sensitive: true,
  };
}

function issuerField(source: string): FieldSpec {
  return {
    name: 'issuerAdministrativeAreaConceptId',
    type: 'uuid',
    required: true,
    description:
      'Concepto (UUID) del departamento que expidió el documento: un carnet no es único sin decir dónde se expidió',
    example: SYNTHETIC_UUID_1,
    source,
  };
}

/** Alta masiva de pacientes. */
export const PATIENT_USERS_SCHEMA: KindSchema = {
  kind: 'usuario-paciente',
  version: '1',
  group: 'USERS',
  title: 'Altas de pacientes',
  description:
    'Crea cuentas de pacientes en estado pendiente de activación (sin contraseña): cada titular activa la suya con un token de un solo uso.',
  permission: BULK_IMPORT_PERMISSIONS.users,
  fields: [
    nationalIdField(`${IAM_PATIENT}.nationalId`),
    issuerField(`${IAM_PATIENT}.issuerAdministrativeAreaConceptId`),
    ...nameFields(IAM_PATIENT),
    {
      name: 'email',
      type: 'email',
      required: true,
      description: 'Correo del titular (identificador de la cuenta)',
      example: 'persona.sintetica@ejemplo.invalid',
      source: `${IAM_PATIENT}.email`,
      max: 320,
      sensitive: true,
    },
    {
      name: 'phone',
      type: 'phone',
      required: true,
      description: 'Teléfono de contacto',
      example: '+59170000000',
      source: `${IAM_PATIENT}.phone`,
      max: PHONE_MAX_LENGTH,
      sensitive: true,
    },
    {
      name: 'birthDate',
      type: 'date',
      required: true,
      description: `Fecha de nacimiento (AAAA-MM-DD, desde ${BIRTH_DATE_MIN}, no futura)`,
      example: '1990-05-17',
      source: `${IAM_PATIENT}.birthDate`,
      minDate: BIRTH_DATE_MIN,
      notFuture: true,
      sensitive: true,
    },
    {
      name: 'sexAtBirth',
      type: 'enum',
      required: true,
      description: 'Sexo al nacer',
      example: 'UNKNOWN',
      source: `${IAM_PATIENT}.sexAtBirth`,
      values: BIRTH_SEX_CODES,
    },
    {
      name: 'residenceMunicipalityConceptId',
      type: 'uuid',
      required: true,
      description: 'Concepto (UUID) del municipio de residencia',
      example: SYNTHETIC_UUID_2,
      source: `${IAM_PATIENT}.residenceMunicipalityConceptId`,
    },
    {
      name: 'gender',
      type: 'enum',
      required: false,
      description: 'Género administrativo',
      example: 'UNKNOWN',
      source: `${IAM_PATIENT}.gender`,
      values: ADMIN_GENDER_CODES,
    },
    {
      name: 'timeZone',
      type: 'string',
      required: false,
      description: 'Zona horaria IANA',
      example: 'America/La_Paz',
      source: `${IAM_PATIENT}.timeZone`,
      max: 100,
    },
    {
      name: 'homeAddressLines',
      type: 'string',
      required: false,
      description: 'Dirección del domicilio',
      example: 'Calle Ficticia 123',
      source: `${IAM_PATIENT}.homeAddressLines`,
      min: 1,
      max: 500,
      sensitive: true,
    },
    {
      name: 'homeDistrict',
      type: 'string',
      required: false,
      description: 'Zona o barrio del domicilio',
      example: 'Zona Demo',
      source: `${IAM_PATIENT}.homeDistrict`,
      max: 200,
      sensitive: true,
    },
  ],
  rules: [
    'No lleva contraseña: la cuenta nace pendiente y el titular la activa con un token de un solo uso.',
    'El documento junto con el departamento que lo expidió, y el correo, no pueden repetirse dentro del archivo.',
    'Una cuenta que ya existe con ese correo se omite; no se duplica ni se modifica.',
    'Una columna que no figura en esta plantilla rechaza la fila.',
  ],
  uniqueKeys: [['nationalId', 'issuerAdministrativeAreaConceptId'], ['email']],
};

/** Alta masiva de profesionales de la salud. */
export const PRACTITIONER_USERS_SCHEMA: KindSchema = {
  kind: 'usuario-profesional',
  version: '1',
  group: 'USERS',
  title: 'Altas de profesionales',
  description:
    'Crea cuentas de profesionales de la salud en estado pendiente de activación, con su matrícula y su documento. La verificación de la matrícula sigue el circuito de admisión.',
  permission: BULK_IMPORT_PERMISSIONS.users,
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      description: 'Correo del profesional (identificador de la cuenta)',
      example: 'profesional.sintetico@ejemplo.invalid',
      source: `${IAM_PRACTITIONER}.email`,
      max: 320,
      sensitive: true,
    },
    ...nameFields(IAM_PRACTITIONER),
    {
      name: 'licenseNumber',
      type: 'string',
      required: true,
      description: 'Número de matrícula profesional',
      example: 'MAT-SINT-0001',
      source: `${IAM_PRACTITIONER}.licenseNumber`,
      min: 1,
      max: 100,
      sensitive: true,
    },
    nationalIdField(`${IAM_PRACTITIONER}.nationalId`),
    issuerField(`${IAM_PRACTITIONER}.issuerAdministrativeAreaConceptId`),
    {
      name: 'professionalTitle',
      type: 'string',
      required: false,
      description: 'Título profesional',
      example: 'Médico (dato de ejemplo)',
      source: `${IAM_PRACTITIONER}.professionalTitle`,
      max: 100,
    },
    {
      name: 'regulatoryAuthority',
      type: 'string',
      required: false,
      description: 'Autoridad que emitió la matrícula',
      example: 'Autoridad de ejemplo',
      source: `${IAM_PRACTITIONER}.regulatoryAuthority`,
      max: 200,
    },
    {
      name: 'licenseIssueDate',
      type: 'date',
      required: false,
      description: 'Fecha de emisión de la matrícula',
      example: '2015-03-01',
      source: `${IAM_PRACTITIONER}.licenseIssueDate`,
      notFuture: true,
    },
    {
      name: 'phone',
      type: 'phone',
      required: false,
      description: 'Teléfono de contacto',
      example: '+59170000001',
      source: `${IAM_PRACTITIONER}.phone`,
      max: PHONE_MAX_LENGTH,
      sensitive: true,
    },
    {
      name: 'birthDate',
      type: 'date',
      required: false,
      description: 'Fecha de nacimiento (AAAA-MM-DD)',
      example: '1985-02-10',
      source: `${IAM_PRACTITIONER}.birthDate`,
      minDate: BIRTH_DATE_MIN,
      notFuture: true,
      sensitive: true,
    },
    {
      name: 'specialtyConceptIds',
      type: 'uuidList',
      required: false,
      description: `Conceptos (UUID) de especialidad, separados por «|» (máximo 10)`,
      example: SYNTHETIC_UUID_1,
      source: `${IAM_PRACTITIONER}.specialtyConceptIds`,
      max: 10,
    },
  ],
  rules: [
    'No lleva contraseña ni roles clínicos: los roles se conceden en el gobierno de permisos, no por archivo.',
    'La matrícula, el documento con su departamento de expedición y el correo no pueden repetirse dentro del archivo.',
    'Una cuenta que ya existe con ese correo se omite; no se duplica ni se modifica.',
    'Una columna que no figura en esta plantilla rechaza la fila.',
  ],
  uniqueKeys: [
    ['licenseNumber'],
    ['nationalId', 'issuerAdministrativeAreaConceptId'],
    ['email'],
  ],
};

/** Alta masiva de personal de una organización. */
export const STAFF_USERS_SCHEMA: KindSchema = {
  kind: 'usuario-personal-organizacion',
  version: '1',
  group: 'USERS',
  title: 'Altas de personal de la organización',
  description:
    'Crea cuentas de personal y las incorpora como miembros de la organización activa (la del encabezado X-Tenant-Id).',
  permission: BULK_IMPORT_PERMISSIONS.users,
  fields: [
    {
      name: 'displayName',
      type: 'string',
      required: true,
      description: 'Nombre para mostrar',
      example: 'Persona Sintetica',
      source: `${IAM_CREATE_USER}.displayName`,
      min: 1,
      max: 200,
      sensitive: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      description: 'Correo de la cuenta',
      example: 'personal.sintetico@ejemplo.invalid',
      source: `${IAM_CREATE_USER}.email`,
      max: 320,
      sensitive: true,
    },
    {
      name: 'phone',
      type: 'phone',
      required: false,
      description: 'Teléfono de contacto',
      example: '+59170000002',
      source: `${IAM_CREATE_USER}.phone`,
      max: PHONE_MAX_LENGTH,
      sensitive: true,
    },
    {
      name: 'timeZone',
      type: 'string',
      required: false,
      description: 'Zona horaria IANA',
      example: 'America/La_Paz',
      source: `${IAM_CREATE_USER}.timeZone`,
      max: 100,
    },
    {
      name: 'role',
      type: 'enum',
      required: false,
      description: 'Rol dentro de la organización (por defecto STAFF)',
      example: 'STAFF',
      source: `${DIR_MEMBERSHIP}.role`,
      values: ['ADMIN', 'STAFF'],
    },
    {
      name: 'accessScope',
      type: 'enum',
      required: false,
      description: 'Alcance de acceso dentro de la organización',
      example: 'ALL_TENANT',
      source: `${DIR_MEMBERSHIP}.accessScope`,
      values: ['ALL_TENANT', 'BRANCH'],
    },
    {
      name: 'primaryBranchId',
      type: 'uuid',
      required: false,
      description: 'Sede principal (UUID de una sede de la organización)',
      example: SYNTHETIC_UUID_1,
      source: `${DIR_MEMBERSHIP}.primaryBranchId`,
    },
  ],
  rules: [
    'No lleva contraseña: la cuenta nace pendiente y el titular la activa con un token de un solo uso.',
    'El rol OWNER y el rol global SECURITY_ADMIN no se conceden por archivo.',
    'El correo no puede repetirse dentro del archivo.',
    'Una cuenta que ya existe con ese correo se omite; no se duplica ni se modifica.',
    'Una columna que no figura en esta plantilla rechaza la fila.',
  ],
  uniqueKeys: [['email']],
};

/** Todos los tipos de alta de usuarios. */
export const USER_SCHEMAS: readonly KindSchema[] = [
  PATIENT_USERS_SCHEMA,
  PRACTITIONER_USERS_SCHEMA,
  STAFF_USERS_SCHEMA,
];
