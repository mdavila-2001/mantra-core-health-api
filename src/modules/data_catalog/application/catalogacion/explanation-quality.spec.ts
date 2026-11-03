import {
  TemplateIndex,
  classifyColumnBusiness,
  classifyDtoFieldDescription,
  classifyOperationExplanation,
  classifyTablePurpose,
  isPlaceholder,
  skeletonOf,
  standardRuleOf,
  tally,
} from './explanation-quality';

const columna = (
  name: string,
  nativeType: string,
  text: string | null,
  kind: string | null = null,
) => ({
  name,
  nativeType,
  description: { text, kind, reference: text ? 'ref:1' : null },
});

describe('skeletonOf', () => {
  it('quita el nombre de la tabla y sus palabras, los números y lo que va entre comillas', () => {
    const a = skeletonOf(
      'Preserva versiones o estados históricos de accounts para auditar.',
      ['accounts_history'],
    );
    const b = skeletonOf(
      'Preserva versiones o estados históricos de conditions para auditar.',
      ['conditions_history'],
    );
    expect(a).toBe(b);
    expect(skeletonOf('Usa `x` 3 veces', [])).toBe('usa <c> <n> veces');
  });

  it('no se come las palabras cortas (id) ni las que no son del nombre', () => {
    expect(skeletonOf('Guarda el id de la cita en el turno', ['cita_id'])).toBe(
      'guarda el id de la <t> en el turno',
    );
  });
});

describe('TemplateIndex', () => {
  it('es plantilla desde 3 objetos distintos, no por repetirse en el mismo objeto', () => {
    const idx = new TemplateIndex();
    idx.add('a', 'Registra eventos de alpha_log.', ['alpha_log']);
    idx.add('a', 'Registra eventos de alpha_log.', ['alpha_log']);
    idx.add('b', 'Registra eventos de beta_log.', ['beta_log']);
    expect(idx.isTemplate('Registra eventos de beta_log.', ['beta_log'])).toBe(
      false,
    );
    idx.add('c', 'Registra eventos de gamma_log.', ['gamma_log']);
    expect(
      idx.isTemplate('Registra eventos de gamma_log.', ['gamma_log']),
    ).toBe(true);
    expect(idx.countOf('Registra eventos de gamma_log.', ['gamma_log'])).toBe(
      3,
    );
  });
});

describe('moldes de generador', () => {
  it('reconoce los moldes conocidos y no un texto propio', () => {
    expect(
      isPlaceholder('Valor de recorded at mantenido por la instancia.'),
    ).toBe(true);
    expect(isPlaceholder('Identificador asociado a subject.')).toBe(true);
    expect(isPlaceholder('FK → iam.users')).toBe(true);
    expect(
      isPlaceholder(
        'Tope de recordatorios por invitación. Nulo significa que no se envían.',
      ),
    ).toBe(false);
  });
});

describe('standardRuleOf', () => {
  it('exige nombre y tipo', () => {
    expect(standardRuleOf('created_at', 'timestamptz')?.id).toBe(
      'std.created_at',
    );
    expect(standardRuleOf('created_at', 'varchar')).toBeNull();
    expect(standardRuleOf('row_version', 'int4')?.id).toBe('std.row_version');
    expect(standardRuleOf('nombre', 'varchar')).toBeNull();
  });
});

describe('classifyColumnBusiness: las cuatro calidades', () => {
  const index = new TemplateIndex();
  for (const t of ['t1', 't2', 't3'])
    index.add(`${t}.x`, 'Documento consultado en la visita.', [t, 'x']);

  it('CURADA: texto propio, también sobre una columna estándar si es más específico', () => {
    const q = classifyColumnBusiness(
      columna('doctor_id', 'uuid', 'Doctor visitado.', 'JSDOC_ENTIDAD'),
      ['visits'],
      index,
    );
    expect(q).toMatchObject({
      quality: 'CURADA',
      source: 'JSDOC_ENTIDAD',
      text: 'Doctor visitado.',
    });
    const std = classifyColumnBusiness(
      columna(
        'tenant_id',
        'uuid',
        'tenant_id = organizacion del equipo que escribe la nota (misma regla que otra).',
        'MODELO_PUML',
      ),
      ['notes'],
      index,
    );
    expect(std).toMatchObject({
      quality: 'CURADA',
      source: 'COMENTARIO_MODELO',
    });
  });

  it('AUTO_DETECTADA: columna estándar con la descripción de la regla, con procedencia determinista', () => {
    const q = classifyColumnBusiness(
      columna(
        'created_at',
        'timestamptz',
        'Fecha y hora en que se creó el registro.',
        'JSDOC_ESTANDAR',
      ),
      ['visits'],
      index,
    );
    expect(q).toMatchObject({
      quality: 'AUTO_DETECTADA',
      source: 'REGLA_DETERMINISTA',
      reference: 'std.created_at',
    });
    const sinTexto = classifyColumnBusiness(
      columna('deleted_at', 'timestamptz', null),
      ['visits'],
      index,
    );
    expect(sinTexto).toMatchObject({
      quality: 'AUTO_DETECTADA',
      reference: 'std.deleted_at',
    });
  });

  it('PLANTILLA: molde conocido o frase repetida en 3 objetos', () => {
    expect(
      classifyColumnBusiness(
        columna(
          'x',
          'int4',
          'Valor de x mantenido por la instancia.',
          'JSDOC_ENTIDAD',
        ),
        ['t9'],
        index,
      ).quality,
    ).toBe('PLANTILLA');
    const rep = classifyColumnBusiness(
      columna(
        'x',
        'text',
        'Documento consultado en la visita.',
        'JSDOC_ENTIDAD',
      ),
      ['t1'],
      index,
    );
    expect(rep.quality).toBe('PLANTILLA');
    expect(rep.reason).toMatch(/3 objetos/);
  });

  it('VACIA: sin texto y sin regla, nunca se rellena', () => {
    const q = classifyColumnBusiness(
      columna('status_concept_id', 'uuid', null),
      ['visits'],
      index,
    );
    expect(q).toEqual({
      quality: 'VACIA',
      text: null,
      source: 'NINGUNA',
      reference: null,
      reason: expect.any(String),
    });
  });
});

describe('classifyTablePurpose', () => {
  const index = new TemplateIndex();
  for (const t of ['a_history', 'b_history', 'c_history'])
    index.add(
      t,
      `Preserva versiones o estados históricos de ${t.replace('_history', '')} para auditar.`,
      [t],
    );
  index.add(
    'own',
    'Mantiene los eventos de consentimiento para reconstruir otorgamientos.',
    ['own'],
  );
  const tabla = (id: string, text: string | null) => ({
    id,
    name: id,
    purpose: { text, reference: 'diagram.puml' },
  });

  it('CURADA con comentario propio; PLANTILLA si se repite; la bóveda propia rescata la plantilla', () => {
    expect(
      classifyTablePurpose(
        tabla(
          'own',
          'Mantiene los eventos de consentimiento para reconstruir otorgamientos.',
        ),
        index,
      ).quality,
    ).toBe('CURADA');
    const plantilla = classifyTablePurpose(
      tabla(
        'a_history',
        'Preserva versiones o estados históricos de a para auditar.',
      ),
      index,
    );
    expect(plantilla.quality).toBe('PLANTILLA');
    const rescatada = classifyTablePurpose(
      tabla(
        'a_history',
        'Preserva versiones o estados históricos de a para auditar.',
      ),
      index,
      { text: 'Historial de cuentas.', reference: 'SALUD/Entidades/E a.md' },
    );
    expect(rescatada).toMatchObject({
      quality: 'CURADA',
      source: 'NOTA_BOVEDA',
    });
  });

  it('VACIA sin comentario ni bóveda', () => {
    expect(classifyTablePurpose(tabla('z', null), index).quality).toBe('VACIA');
  });
});

describe('operaciones y campos de DTO', () => {
  it('AUTO_DETECTADA mientras nadie revisó; VACIA sin fuente; CURADA con revisión humana', () => {
    expect(
      classifyOperationExplanation(
        { estado: 'AUTO_DETECTADA', texto: 'Registrar X.' },
        'AUTO_DETECTADA',
        'op',
      ).quality,
    ).toBe('AUTO_DETECTADA');
    expect(
      classifyOperationExplanation(
        { estado: 'SIN_FUENTE', texto: null },
        'AUTO_DETECTADA',
        'op',
      ).quality,
    ).toBe('VACIA');
    expect(
      classifyOperationExplanation(
        { estado: 'AUTO_DETECTADA', texto: 'Registrar X.' },
        'REVISADA',
        'op',
      ).quality,
    ).toBe('CURADA');
  });

  it('campos de DTO: molde, propio y vacío; el conteo suma', () => {
    const idx = new TemplateIndex();
    const textos = [
      classifyDtoFieldDescription(
        { name: 'a', description: 'Valor de a mantenido por la instancia.' },
        'D',
        idx,
        null,
      ),
      classifyDtoFieldDescription(
        { name: 'b', description: 'Fecha límite para confirmar la cita.' },
        'D',
        idx,
        null,
      ),
      classifyDtoFieldDescription(
        { name: 'c', description: null },
        'D',
        idx,
        null,
      ),
    ];
    expect(tally(textos)).toEqual({
      CURADA: 1,
      PLANTILLA: 1,
      AUTO_DETECTADA: 0,
      VACIA: 1,
    });
  });
});
