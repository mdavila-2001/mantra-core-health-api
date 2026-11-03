import type { Sensitivity } from '../catalog/catalog.constants';

/**
 * Tabla declarativa de la clasificación automática: qué nombres y tipos de columna delatan qué
 * nivel de sensibilidad. Es una tabla y no una cadena de `if` para que agregar una regla sea
 * agregar una fila, y para que una prueba pueda comprobar que están cubiertos los 18
 * identificadores de Safe Harbor.
 *
 * Fuentes: HIPAA 45 CFR 164.514(b)(2)(i) (identificadores A–R) y LGPD art. 11 (datos personales
 * sensibles). La regla de oro vive en `column-classifier.ts`: ante duda, el nivel más alto y a
 * revisión; con certeza, `AUTO_DETECTED`.
 */

/** Familia del tipo nativo de una columna: lo que un valor puede físicamente contener. */
export type ValueKind =
  'BOOLEAN' | 'TEMPORAL' | 'NUMERIC' | 'NETWORK' | 'UUID' | 'TEXT';

/** Confianza de una regla: con cuánta frecuencia acierta la coincidencia por nombre. */
export const CONFIDENCE = {
  /** El nombre dice lo que es: identificador, credencial, categoría sensible. */
  CERTAIN: 0.95,
  /** Casi siempre es eso, pero hay usos que no (p. ej. teléfono de una organización). */
  LIKELY: 0.9,
  /** Puede serlo o no: se clasifica al nivel más alto y una persona decide. */
  AMBIGUOUS: 0.5,
} as const;

/**
 * Desde esta confianza una clasificación es una detección (`AUTO_DETECTED`); por debajo, va a
 * revisión (`NEEDS_REVIEW`).
 */
export const CERTAINTY_THRESHOLD = 0.9;

/** Versión de la tabla de reglas; viaja en `classified_by` de cada revisión. */
export const CLASSIFIER_VERSION = 'catalog-classifier/v1';

/** Quién clasificó: el nombre de la identidad automática más su versión. */
export const CLASSIFIED_BY = `AUTO_CLASSIFIER:${CLASSIFIER_VERSION}`;

/** Tokens que cambian lo que un nombre significa: el valor deja de ser el dato que el nombre dice. */
export const DERIVED_FORM_TOKENS: ReadonlySet<string> = new Set([
  'hash',
  'sha256',
  'digest',
  'encrypted',
  'masked',
]);
export const POINTER_TOKENS: ReadonlySet<string> = new Set([
  'ref',
  'reference',
  'id',
  'ids',
]);
export const STATE_TOKENS: ReadonlySet<string> = new Set([
  'verified',
  'count',
  'enabled',
  'required',
  'type',
  'status',
  'template',
  'pattern',
  'domain',
  'domains',
  'policy',
  'rule',
]);
/** Todo lo que degrada una coincidencia por nombre a duda. */
export const ALL_MODIFIER_TOKENS: ReadonlySet<string> = new Set([
  ...DERIVED_FORM_TOKENS,
  ...POINTER_TOKENS,
  ...STATE_TOKENS,
]);
/** Para las credenciales, un hash o un cifrado **sigue siendo** la credencial; un puntero a ella no. */
export const CREDENTIAL_MODIFIER_TOKENS: ReadonlySet<string> = new Set([
  ...POINTER_TOKENS,
  ...STATE_TOKENS,
]);

export interface ClassificationRule {
  /** Identificador estable; viaja en la revisión para saber qué regla decidió. */
  readonly id: string;
  readonly level: Sensitivity;
  readonly confidence: number;
  /** Norma o identificador que sustenta la regla. */
  readonly basis: string;
  /**
   * Nombres que activan la regla, en `snake_case`. Un término coincide si sus palabras aparecen
   * seguidas en el nombre de la columna (`phone` coincide con `contact_phone`).
   */
  readonly terms?: readonly string[];
  /** La regla se activa por el tipo nativo (`inet`), sin mirar el nombre. */
  readonly nativeType?: RegExp;
  /** Familias de tipo en que la regla aplica; por omisión, todas menos booleano y temporal. */
  readonly on?: readonly ValueKind[];
  /** La regla sólo aplica a objetos cuyo nombre cumpla esto (p. ej. `name` en tablas de personas). */
  readonly objects?: RegExp;
  /** Tokens que bajan la coincidencia a duda; por omisión, todos los modificadores. */
  readonly doubtTokens?: ReadonlySet<string>;
}

/** Familias de tipo por omisión: un valor booleano o temporal no contiene un identificador. */
export const DEFAULT_KINDS: readonly ValueKind[] = [
  'TEXT',
  'NUMERIC',
  'NETWORK',
  'UUID',
];

/** Tablas que hablan de personas: ahí un `name` pelado es el nombre de una persona. */
export const PERSON_OBJECT =
  /(person|patient|user|practitioner|contact|profile|member|employee|staff|subscriber|beneficiar|guardian|relative|visitor|holder)/i;

/**
 * Schemas de datos clínicos: lo que guardan es de personas atendidas. Con `PERSON_OBJECT` forman el
 * contexto de personas: sólo ahí una coincidencia por nombre es una detección con certeza.
 */
export const PERSON_SCHEMAS: ReadonlySet<string> = new Set([
  'clinical',
  'clinical_ext',
  'chart',
  'profiles',
  'diagnostics',
  'consent',
  'procedures_perioperative',
  'health_data',
]);

const HIPAA = '45 CFR 164.514(b)(2)(i)';
const LGPD = 'LGPD art. 11';

/**
 * Las reglas. Ante dos reglas que coinciden gana la de nivel más alto, y a igual nivel la de más
 * confianza (ver `classifyColumn`).
 */
export const CLASSIFICATION_RULES: readonly ClassificationRule[] = [
  // ---- Safe Harbor: los 18 identificadores (PHI_IDENTIFIER) ------------------------------
  {
    id: 'SH_A_NAME',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(A) nombres`,
    terms: [
      'first_name',
      'last_name',
      'middle_name',
      'full_name',
      'given_name',
      'family_name',
      'maiden_name',
      'mother_last_name',
      'patient_name',
      'surname',
      'nombre_completo',
      'apellido',
    ],
  },
  {
    id: 'SH_A_NAME_IN_PERSON_TABLE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(A) nombres`,
    terms: ['name', 'nombre'],
    objects: PERSON_OBJECT,
  },
  {
    id: 'SH_A_NAME_MAYBE_PERSON',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.AMBIGUOUS,
    basis: `${HIPAA}(A) nombres (puede ser una organización)`,
    terms: [
      'display_name',
      'user_name',
      'username',
      'holder_name',
      'owner_name',
      'recipient_name',
      'contact_name',
      'author_name',
      'legal_name',
    ],
  },
  {
    id: 'SH_B_GEOGRAPHY',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(B) subdivisiones geográficas menores que un estado`,
    terms: [
      'address',
      'street',
      'street_address',
      'address_line',
      'address_line1',
      'address_line2',
      'city',
      'zip',
      'zip_code',
      'postal_code',
      'postcode',
      'neighborhood',
      'barrio',
      'direccion',
      'latitude',
      'longitude',
      'lat',
      'lng',
      'geolocation',
      'coordinates',
    ],
  },
  {
    id: 'SH_C_DATE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(C) fechas, salvo el año, relacionadas con la persona`,
    terms: [
      'birth_date',
      'date_of_birth',
      'birthdate',
      'dob',
      'born_at',
      'fecha_nacimiento',
      'admission_date',
      'admitted_at',
      'discharge_date',
      'discharged_at',
      'death_date',
      'date_of_death',
      'deceased_at',
    ],
    on: ['TEMPORAL', 'TEXT'],
  },
  {
    id: 'SH_D_PHONE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(D) números de teléfono`,
    terms: [
      'phone',
      'telephone',
      'mobile',
      'cellphone',
      'cell',
      'whatsapp',
      'msisdn',
      'telefono',
      'celular',
    ],
  },
  {
    id: 'SH_E_FAX',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(E) números de fax`,
    terms: ['fax'],
  },
  {
    id: 'SH_F_EMAIL',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(F) direcciones de correo electrónico`,
    terms: ['email', 'e_mail', 'email_address', 'correo'],
  },
  {
    id: 'SH_G_NATIONAL_ID',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(G) números de seguro social o documento de identidad`,
    terms: [
      'ssn',
      'social_security',
      'social_security_number',
      'national_id',
      'national_id_number',
      'identity_number',
      'identification_number',
      'id_number',
      'passport_number',
      'passport',
      'cedula',
      'dni',
      'curp',
      'cpf',
      'ci_number',
      'tax_id',
      'tax_number',
      'nit',
    ],
  },
  {
    id: 'SH_G_DOCUMENT_NUMBER',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.AMBIGUOUS,
    basis: `${HIPAA}(G) número de documento (puede ser de un documento que no identifica a una persona)`,
    terms: ['document_number', 'identity_document'],
  },
  {
    id: 'SH_H_MEDICAL_RECORD',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(H) números de historia clínica`,
    terms: [
      'mrn',
      'medical_record_number',
      'medical_record_no',
      'clinical_history_number',
      'history_number',
      'chart_number',
      'patient_number',
      'patient_code',
      'hc_number',
    ],
  },
  {
    id: 'SH_I_BENEFICIARY',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(I) números de beneficiario del plan de salud`,
    terms: [
      'beneficiary_number',
      'policy_number',
      'member_number',
      'member_id',
      'subscriber_id',
      'insurance_number',
      'affiliation_number',
    ],
  },
  {
    id: 'SH_J_ACCOUNT',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(J) números de cuenta`,
    terms: [
      'account_number',
      'bank_account',
      'iban',
      'card_number',
      'credit_card',
    ],
  },
  {
    id: 'SH_K_LICENSE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(K) números de certificado o licencia`,
    terms: [
      'license_number',
      'licence_number',
      'certificate_number',
      'professional_license',
      'registration_number',
      'matricula',
      'colegiatura',
    ],
  },
  {
    id: 'SH_L_VEHICLE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(L) identificadores de vehículos y placas`,
    terms: [
      'license_plate',
      'plate_number',
      'vin',
      'vehicle_identification_number',
    ],
  },
  {
    id: 'SH_M_DEVICE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(M) identificadores y números de serie de dispositivos`,
    terms: ['device_serial', 'imei', 'udi', 'device_identifier', 'mac_address'],
  },
  {
    id: 'SH_M_SERIAL_NUMBER',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.AMBIGUOUS,
    basis: `${HIPAA}(M) número de serie (de un dispositivo implantado o de un artículo cualquiera)`,
    terms: ['serial_number'],
  },
  {
    id: 'SH_N_URL',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(N) URL personales`,
    terms: [
      'profile_url',
      'photo_url',
      'avatar_url',
      'picture_url',
      'social_url',
      'personal_url',
      'personal_website',
    ],
  },
  {
    id: 'SH_O_IP_NAME',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(O) direcciones IP`,
    terms: ['ip', 'ip_address', 'client_ip', 'remote_addr', 'ip_addr'],
  },
  {
    id: 'SH_O_IP_TYPE',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(O) direcciones IP (por tipo)`,
    nativeType: /^(inet|cidr)$/i,
    on: ['NETWORK'],
  },
  {
    id: 'SH_P_BIOMETRIC',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${HIPAA}(P) identificadores biométricos`,
    // «fingerprint» pelado NO: es el hash de un schema, un dataset o un dispositivo. Biométrico
    // sólo con contexto explícito (plantilla, escaneo) o en una tabla biométrica (regla de abajo).
    terms: [
      'fingerprint_template',
      'finger_print_template',
      'voiceprint',
      'faceprint',
      'retina_scan',
      'iris_scan',
    ],
  },
  {
    id: 'SH_M_DEVICE_FINGERPRINT',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.AMBIGUOUS,
    basis: `${HIPAA}(M) huella de dispositivo: identifica un dispositivo, no una biometría`,
    terms: ['device_fingerprint'],
  },
  {
    id: 'SH_Q_PHOTO',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.LIKELY,
    basis: `${HIPAA}(Q) fotografías de rostro completo e imágenes comparables`,
    terms: [
      'photo',
      'selfie',
      'face_image',
      'profile_picture',
      'profile_image',
      'avatar',
    ],
  },
  {
    id: 'SH_R_OTHER_IDENTIFIER',
    level: 'PHI_IDENTIFIER',
    confidence: CONFIDENCE.AMBIGUOUS,
    basis: `${HIPAA}(R) cualquier otro número, característica o código de identificación único`,
    terms: [
      'patient_identifier',
      'person_identifier',
      'external_identifier',
      'unique_identifier',
      'identifier_value',
      'identification_code',
      'unique_code',
    ],
  },

  // ---- Datos personales (LGPD art. 5, I) ---------------------------------------------------
  {
    id: 'LGPD_PERSONAL_DEMOGRAPHIC',
    level: 'PERSONAL',
    confidence: CONFIDENCE.LIKELY,
    basis:
      'LGPD art. 5, I: información relacionada con persona natural identificada',
    terms: [
      'gender',
      'sex',
      'nationality',
      'marital_status',
      'occupation',
      'nickname',
    ],
    doubtTokens: new Set(['hash', 'sha256', 'digest', 'masked', 'count']),
  },

  {
    id: 'LGPD_PERSONAL_LANGUAGE',
    level: 'PERSONAL',
    confidence: CONFIDENCE.LIKELY,
    basis: 'LGPD art. 5, I: idioma preferido de una persona',
    // el idioma de una plantilla o de un campo no es de nadie: sólo cuenta en tablas de personas
    terms: ['language'],
    objects: PERSON_OBJECT,
    doubtTokens: new Set(['hash', 'sha256', 'digest', 'masked', 'count']),
  },

  // ---- Datos clínicos (PHI_SENSITIVE) -------------------------------------------------------
  {
    id: 'PHI_CLINICAL',
    level: 'PHI_SENSITIVE',
    confidence: CONFIDENCE.CERTAIN,
    basis: '45 CFR 160.103 (información de salud protegida): dato clínico',
    terms: [
      'diagnosis',
      'diagnoses',
      'icd10',
      'icd_code',
      'allergy',
      'allergies',
      'medication',
      'medications',
      'prescription',
      'dosage',
      'symptom',
      'symptoms',
      'lab_result',
      'test_result',
      'result_value',
      'observation_value',
      'clinical_note',
      'clinical_notes',
      'anamnesis',
      'treatment',
      'procedure_description',
      'blood_pressure',
      'heart_rate',
      'blood_type',
      'bmi',
      'glucose',
      'vital_signs',
      'family_history',
      'surgery',
    ],
  },

  // ---- Categorías sensibles (PHI_SPECIAL) ---------------------------------------------------
  {
    id: 'LGPD_ORIGIN',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: origen racial o étnico`,
    terms: ['race', 'ethnicity', 'ethnic_group', 'ethnic_origin', 'skin_color'],
  },
  {
    id: 'LGPD_RELIGION',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: convicción religiosa`,
    terms: ['religion', 'religious_belief', 'creed'],
  },
  {
    id: 'LGPD_POLITICAL',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: opinión política`,
    terms: ['political_opinion', 'political_party', 'political_affiliation'],
  },
  {
    id: 'LGPD_UNION',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: afiliación a sindicato u organización religiosa, filosófica o política`,
    terms: ['union_membership', 'trade_union', 'sindicato'],
  },
  {
    id: 'LGPD_SEX_LIFE',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: vida sexual`,
    terms: ['sexual_orientation', 'sex_life', 'sexual_history'],
  },
  {
    id: 'LGPD_GENETIC',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: dato genético`,
    terms: ['genetic', 'genome', 'dna', 'genotype', 'gene_variant'],
  },
  {
    id: 'LGPD_BIOMETRIC',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: dato biométrico`,
    terms: [
      'biometric',
      'biometrics',
      'fingerprint_template',
      'finger_print_template',
      'voiceprint',
      'faceprint',
      'face_template',
      'retina_scan',
      'iris_scan',
    ],
  },
  {
    id: 'LGPD_BIOMETRIC_TABLE',
    level: 'PHI_SPECIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: `${LGPD}: dato biométrico (la tabla es explícitamente biométrica)`,
    terms: ['fingerprint', 'voiceprint', 'retina', 'iris', 'faceprint'],
    objects: /biometric/i,
  },

  // ---- Credenciales -------------------------------------------------------------------------
  {
    id: 'CREDENTIAL_SECRET',
    level: 'CREDENTIAL',
    confidence: CONFIDENCE.CERTAIN,
    basis: 'Contraseñas, tokens y secretos',
    terms: [
      'password',
      'passwd',
      'pwd',
      'secret',
      'client_secret',
      'api_key',
      'apikey',
      'access_token',
      'refresh_token',
      'id_token',
      'session_token',
      'push_token',
      'auth_token',
      'token_hash',
      'private_key',
      'secret_key',
      'signing_key',
      'encryption_key',
      'otp',
      'totp',
      'pin',
      'pin_hash',
      'salt',
      'credential',
      'credentials',
    ],
    on: ['TEXT'],
    doubtTokens: CREDENTIAL_MODIFIER_TOKENS,
  },
  {
    id: 'CREDENTIAL_GENERIC_TOKEN',
    level: 'CREDENTIAL',
    confidence: CONFIDENCE.AMBIGUOUS,
    basis:
      'Token genérico: puede ser una credencial o un identificador de ventana de reserva',
    terms: ['token'],
    on: ['TEXT'],
    doubtTokens: CREDENTIAL_MODIFIER_TOKENS,
  },
];
