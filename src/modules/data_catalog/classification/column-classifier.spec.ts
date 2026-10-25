import { SENSITIVITIES } from '../catalog/catalog.constants';
import {
  CERTAINTY_THRESHOLD,
  CLASSIFICATION_RULES,
  CLASSIFIED_BY,
} from './classification.rules';
import {
  classifyColumn,
  decideWrite,
  rankOf,
  tokensOf,
  valueKindOf,
  type ClassificationProposal,
  type ClassifiableColumn,
} from './column-classifier';

const col = (
  columnName: string,
  nativeType = 'character varying',
  objectName = 'patient_profiles',
  schemaName?: string,
): ClassifiableColumn => ({ columnName, nativeType, objectName, schemaName });

const nivel = (c: ClassifiableColumn) => classifyColumn(c)?.level ?? null;

describe('tokensOf / valueKindOf', () => {
  it('separa snake_case y camelCase', () => {
    expect(tokensOf('first_name_hash_sha256')).toEqual([
      'first',
      'name',
      'hash',
      'sha256',
    ]);
    expect(tokensOf('birthDate')).toEqual(['birth', 'date']);
  });

  it('reconoce la familia del tipo nativo', () => {
    expect(valueKindOf('boolean')).toBe('BOOLEAN');
    expect(valueKindOf('timestamp with time zone')).toBe('TEMPORAL');
    expect(valueKindOf('date')).toBe('TEMPORAL');
    expect(valueKindOf('integer')).toBe('NUMERIC');
    expect(valueKindOf('numeric(12,2)')).toBe('NUMERIC');
    expect(valueKindOf('inet')).toBe('NETWORK');
    expect(valueKindOf('uuid')).toBe('UUID');
    expect(valueKindOf('jsonb')).toBe('TEXT');
    expect(valueKindOf('text')).toBe('TEXT');
  });
});

describe('la tabla de reglas', () => {
  it('cubre los 18 identificadores de Safe Harbor (A a R)', () => {
    const letras = new Set(
      CLASSIFICATION_RULES.map(
        (r) => /\(b\)\(2\)\(i\)\(([A-R])\)/.exec(r.basis)?.[1],
      ).filter(Boolean),
    );
    expect([...letras].sort().join('')).toBe('ABCDEFGHIJKLMNOPQR');
  });

  it('cubre las categorías sensibles del art. 11 de la LGPD', () => {
    const lgpd = CLASSIFICATION_RULES.filter((r) =>
      r.basis.includes('LGPD art. 11'),
    );
    const ids = lgpd.map((r) => r.id);
    for (const id of [
      'LGPD_ORIGIN',
      'LGPD_RELIGION',
      'LGPD_POLITICAL',
      'LGPD_UNION',
      'LGPD_SEX_LIFE',
      'LGPD_GENETIC',
      'LGPD_BIOMETRIC',
    ])
      expect(ids).toContain(id);
    expect(lgpd.every((r) => r.level === 'PHI_SPECIAL')).toBe(true);
  });

  it('usa sólo niveles del vocabulario, sin FINANCIAL, y ids únicos', () => {
    for (const r of CLASSIFICATION_RULES)
      expect(SENSITIVITIES).toContain(r.level);
    expect(SENSITIVITIES).not.toContain('FINANCIAL');
    const ids = CLASSIFICATION_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda regla tiene confianza entre 0 y 1 y algo por qué activarse', () => {
    for (const r of CLASSIFICATION_RULES) {
      expect(r.confidence).toBeGreaterThan(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
      expect(Boolean(r.terms?.length) || Boolean(r.nativeType)).toBe(true);
    }
  });

  it('la versión del clasificador viaja en classified_by', () => {
    expect(CLASSIFIED_BY).toMatch(/^AUTO_CLASSIFIER:catalog-classifier\/v\d+$/);
  });
});

describe('classifyColumn: identificadores (PHI_IDENTIFIER)', () => {
  it.each([
    ['first_name', 'character varying'],
    ['last_name', 'text'],
    ['mother_last_name', 'text'],
    ['birth_date', 'date'],
    ['fax', 'text'],
    ['national_id', 'text'],
    ['mrn', 'text'],
    ['policy_number', 'text'],
    ['account_number', 'text'],
    ['license_plate', 'text'],
    ['fingerprint_template', 'bytea'],
    ['source_ip', 'inet'],
    ['anything_at_all', 'inet'],
  ])('%s (%s) es identificador con certeza', (nombre, tipo) => {
    const p = classifyColumn(col(nombre, tipo));
    expect(p?.level === 'PHI_IDENTIFIER' || p?.level === 'PHI_SPECIAL').toBe(
      true,
    );
    expect(p?.status).toBe('AUTO_DETECTED');
  });

  it.each([
    ['email', 'SH_F_EMAIL'],
    ['phone', 'SH_D_PHONE'],
    ['address', 'SH_B_GEOGRAPHY'],
  ])('%s se clasifica por la regla %s', (nombre, regla) => {
    expect(classifyColumn(col(nombre))?.ruleId).toBe(regla);
  });

  it('un cifrado o hash del dato conserva el nivel y va a revisión', () => {
    expect(classifyColumn(col('client_ip_address_encrypted'))).toMatchObject({
      level: 'PHI_IDENTIFIER',
      status: 'NEEDS_REVIEW',
    });
  });

  it('el nombre pelado `name` sólo es de una persona en tablas de personas', () => {
    expect(nivel(col('name', 'text', 'patient_profiles'))).toBe(
      'PHI_IDENTIFIER',
    );
    expect(nivel(col('name', 'text', 'catalog_items'))).toBeNull();
  });

  it('un nombre que puede ser de una organización va a revisión, al nivel alto', () => {
    const p = classifyColumn(col('display_name', 'text', 'catalog_items'));
    expect(p).toMatchObject({
      level: 'PHI_IDENTIFIER',
      status: 'NEEDS_REVIEW',
    });
    expect(p!.confidence).toBeLessThan(CERTAINTY_THRESHOLD);
  });

  it('un hash del dato sigue en el nivel del dato pero a revisión (podría ser PSEUDONYMIZED)', () => {
    expect(classifyColumn(col('first_name_hash_sha256'))).toMatchObject({
      level: 'PHI_IDENTIFIER',
      status: 'NEEDS_REVIEW',
    });
  });

  it('el número de documento es dudoso; el documento de identidad con nombre propio no', () => {
    expect(classifyColumn(col('document_number'))).toMatchObject({
      level: 'PHI_IDENTIFIER',
      status: 'NEEDS_REVIEW',
    });
  });
});

describe('classifyColumn: tipo y puntero', () => {
  it('un booleano no contiene el dato (email_verified, phone_verified)', () => {
    expect(nivel(col('email_verified', 'boolean'))).toBeNull();
    expect(nivel(col('must_change_password', 'boolean'))).toBeNull();
  });

  it('una marca de tiempo no contiene el dato salvo en las reglas de fecha', () => {
    expect(
      nivel(col('email_verified_at', 'timestamp with time zone')),
    ).toBeNull();
    expect(nivel(col('birth_date', 'date'))).toBe('PHI_IDENTIFIER');
    expect(nivel(col('discharged_at', 'timestamp with time zone'))).toBe(
      'PHI_IDENTIFIER',
    );
  });

  it('una clave foránea uuid `*_id` es un puntero: lo sensible se clasifica en la tabla apuntada', () => {
    expect(nivel(col('address_id', 'uuid'))).toBeNull();
    expect(nivel(col('crm_email_message_id', 'uuid'))).toBeNull();
    expect(nivel(col('photo_file_id', 'uuid'))).toBeNull();
    expect(nivel(col('medication_request_id', 'uuid'))).toBeNull();
  });

  it('un `*_concept_id` es el dato codificado: sí se clasifica', () => {
    expect(classifyColumn(col('sex_concept_id', 'uuid'))).toMatchObject({
      level: 'PERSONAL',
      status: 'AUTO_DETECTED',
    });
    expect(classifyColumn(col('medication_concept_id', 'uuid'))).toMatchObject({
      level: 'PHI_SENSITIVE',
      status: 'AUTO_DETECTED',
    });
  });

  it('un contador de tokens (entero) no es una credencial', () => {
    expect(nivel(col('input_tokens', 'integer'))).toBeNull();
  });
});

describe('classifyColumn: clínico, sensible y credenciales', () => {
  it('datos clínicos son PHI_SENSITIVE', () => {
    for (const nombre of [
      'preoperative_diagnosis_text',
      'allergies',
      'medication',
      'blood_pressure',
      'clinical_notes',
    ])
      expect(nivel(col(nombre, 'text'))).toBe('PHI_SENSITIVE');
  });

  it('`diagnostics_json` (el laboratorio) no es un diagnóstico', () => {
    expect(nivel(col('diagnostics_json', 'jsonb'))).toBeNull();
  });

  it.each([
    'race',
    'ethnicity',
    'religion',
    'political_opinion',
    'union_membership',
    'sexual_orientation',
    'genotype',
    'biometric_template',
  ])('%s es categoría sensible (PHI_SPECIAL)', (nombre) => {
    expect(nivel(col(nombre, 'text'))).toBe('PHI_SPECIAL');
  });

  it('lo biométrico gana como PHI_SPECIAL aunque Safe Harbor también lo liste', () => {
    expect(nivel(col('fingerprint_template', 'bytea'))).toBe('PHI_SPECIAL');
  });

  it.each([
    'password_hash',
    'client_secret',
    'api_key',
    'refresh_token',
    'secret_encrypted',
  ])('%s es credencial con certeza', (nombre) => {
    expect(classifyColumn(col(nombre, 'text'))).toMatchObject({
      level: 'CREDENTIAL',
      status: 'AUTO_DETECTED',
    });
  });

  it('una referencia a un secreto externo es credencial pero dudosa: a revisión', () => {
    expect(classifyColumn(col('webhook_secret_ref', 'text'))).toMatchObject({
      level: 'CREDENTIAL',
      status: 'NEEDS_REVIEW',
    });
  });

  it('un `token` pelado es dudoso', () => {
    expect(classifyColumn(col('hold_token', 'text'))).toMatchObject({
      level: 'CREDENTIAL',
      status: 'NEEDS_REVIEW',
    });
  });

  it('con varias reglas gana el nivel más alto', () => {
    // «password» (CREDENTIAL) y «phone» (PHI_IDENTIFIER) coinciden: gana la credencial
    expect(nivel(col('phone_password', 'text'))).toBe('CREDENTIAL');
  });

  it('una columna que ninguna regla reconoce queda sin clasificar', () => {
    expect(classifyColumn(col('row_version', 'integer'))).toBeNull();
    expect(
      classifyColumn(col('created_at', 'timestamp with time zone')),
    ).toBeNull();
  });
});

describe('decideWrite: nunca baja, nunca pisa', () => {
  const propuesta = (
    level: ClassificationProposal['level'],
    status: ClassificationProposal['status'] = 'AUTO_DETECTED',
  ): ClassificationProposal => ({
    level,
    status,
    confidence: 0.95,
    ruleId: 'X',
    basis: 'x',
  });

  it('sin ficha, la crea', () => {
    expect(decideWrite(null, propuesta('PERSONAL'))).toEqual({
      action: 'CREATE',
    });
  });

  it('no pisa una ficha escrita por una persona, sea cual sea su estado', () => {
    for (const reviewStatus of [
      'DRAFT',
      'NEEDS_REVIEW',
      'APPROVED',
      'REJECTED',
    ] as const)
      expect(
        decideWrite(
          { origin: 'MANUAL', reviewStatus, sensitivity: 'UNKNOWN' },
          propuesta('CREDENTIAL'),
        ),
      ).toEqual({ action: 'SKIP', reason: 'MANUAL' });
  });

  it('no toca una ficha de la máquina que ya salió de AUTO_DETECTED', () => {
    for (const reviewStatus of [
      'NEEDS_REVIEW',
      'APPROVED',
      'REJECTED',
      'DRAFT',
    ] as const)
      expect(
        decideWrite(
          { origin: 'AUTO_CLASSIFIER', reviewStatus, sensitivity: 'PERSONAL' },
          propuesta('CREDENTIAL'),
        ),
      ).toEqual({ action: 'SKIP', reason: 'REVIEWED' });
  });

  it('sube de nivel una ficha que sigue como la dejó la máquina', () => {
    expect(
      decideWrite(
        {
          origin: 'AUTO_CLASSIFIER',
          reviewStatus: 'AUTO_DETECTED',
          sensitivity: 'PERSONAL',
        },
        propuesta('PHI_IDENTIFIER'),
      ),
    ).toEqual({ action: 'RAISE' });
  });

  it('nunca baja ni reescribe al mismo nivel', () => {
    const actual = {
      origin: 'AUTO_CLASSIFIER' as const,
      reviewStatus: 'AUTO_DETECTED' as const,
      sensitivity: 'PHI_SENSITIVE',
    };
    expect(decideWrite(actual, propuesta('PERSONAL'))).toEqual({
      action: 'SKIP',
      reason: 'NOT_HIGHER',
    });
    expect(decideWrite(actual, propuesta('PHI_SENSITIVE'))).toEqual({
      action: 'SKIP',
      reason: 'NOT_HIGHER',
    });
  });

  it('compara contra el vocabulario anterior sin bajar (PHI antiguo = el más alto de los PHI)', () => {
    expect(rankOf('PHI')).toBe(rankOf('PHI_SPECIAL'));
    expect(rankOf('PII')).toBe(rankOf('PERSONAL'));
    expect(rankOf('SECRET')).toBe(rankOf('CREDENTIAL'));
    expect(
      decideWrite(
        {
          origin: 'AUTO_CLASSIFIER',
          reviewStatus: 'AUTO_DETECTED',
          sensitivity: 'PHI',
        },
        propuesta('PHI_IDENTIFIER'),
      ),
    ).toEqual({ action: 'SKIP', reason: 'NOT_HIGHER' });
  });
});

describe('calibración con casos reales: la certeza exige contexto de personas', () => {
  const casoReal = (
    esquema: string,
    objeto: string,
    columna: string,
    tipo = 'text',
  ) => classifyColumn(col(columna, tipo, objeto, esquema));

  describe('fingerprint', () => {
    it.each([
      ['lakehouse', 'lakehouse_schema_versions', 'schema_fingerprint'],
      ['polyglot_storage', 'dataset_versions', 'schema_fingerprint'],
      ['object_storage', 'files', 'content_fingerprint'],
    ])('%s.%s.%s no se clasifica (huella de un objeto técnico)', (e, o, c) => {
      expect(casoReal(e, o, c)).toBeNull();
    });

    it('iam.devices.device_fingerprint es identificador de dispositivo, en revisión', () => {
      expect(casoReal('iam', 'devices', 'device_fingerprint')).toMatchObject({
        level: 'PHI_IDENTIFIER',
        status: 'NEEDS_REVIEW',
      });
    });

    it('biométrico (PHI_SPECIAL) sólo con contexto explícito', () => {
      expect(
        casoReal('profiles', 'patient_biometrics', 'fingerprint', 'bytea'),
      ).toMatchObject({ level: 'PHI_SPECIAL', status: 'AUTO_DETECTED' });
      expect(
        casoReal(
          'profiles',
          'patient_profiles',
          'fingerprint_template',
          'bytea',
        ),
      ).toMatchObject({ level: 'PHI_SPECIAL', status: 'AUTO_DETECTED' });
      expect(casoReal('iam', 'devices', 'fingerprint')).toBeNull();
    });
  });

  describe('fuera del contexto de personas baja a revisión, sin bajar de nivel', () => {
    it('directory.branches.longitude: ubicación de una sede', () => {
      expect(
        casoReal('directory', 'branches', 'longitude', 'numeric'),
      ).toMatchObject({
        level: 'PHI_IDENTIFIER',
        status: 'NEEDS_REVIEW',
      });
    });

    it('pharmacy.pharmacy_products.medication_concept_id: catálogo de productos', () => {
      expect(
        casoReal(
          'pharmacy',
          'pharmacy_products',
          'medication_concept_id',
          'uuid',
        ),
      ).toMatchObject({ level: 'PHI_SENSITIVE', status: 'NEEDS_REVIEW' });
    });

    it('la misma regla con certeza en un schema clínico', () => {
      expect(
        casoReal(
          'clinical',
          'medication_requests',
          'medication_concept_id',
          'uuid',
        ),
      ).toMatchObject({ level: 'PHI_SENSITIVE', status: 'AUTO_DETECTED' });
    });

    it('la misma regla con certeza en una tabla de personas de otro schema', () => {
      expect(
        casoReal('directory', 'branches', 'longitude', 'numeric')?.status,
      ).toBe('NEEDS_REVIEW');
      expect(
        casoReal('directory', 'practitioner_locations', 'longitude', 'numeric'),
      ).toMatchObject({ level: 'PHI_IDENTIFIER', status: 'AUTO_DETECTED' });
    });

    it('una credencial lo es en cualquier tabla, con certeza', () => {
      expect(
        casoReal('integrations', 'provider_connections', 'client_secret'),
      ).toMatchObject({ level: 'CREDENTIAL', status: 'AUTO_DETECTED' });
    });
  });

  describe('idioma: sólo cuenta en tablas de personas', () => {
    it.each([
      ['audio_assets', 'audio_templates', 'language', 'text'],
      ['messaging', 'message_templates', 'language_concept_id', 'uuid'],
      [
        'forms',
        'field_definition_localizations',
        'language_concept_id',
        'uuid',
      ],
    ])('%s.%s.%s no se clasifica', (e, o, c, t) => {
      expect(casoReal(e, o, c, t)).toBeNull();
    });

    it('iam.users.preferred_language_concept_id sí es dato personal', () => {
      expect(
        casoReal('iam', 'users', 'preferred_language_concept_id', 'uuid'),
      ).toMatchObject({ level: 'PERSONAL', status: 'AUTO_DETECTED' });
    });
  });
});
