import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { AddVersionDto, CreateNoteDto, MAX_NOTE_ENTRIES } from './notes.dto';

/**
 * Kill-test de P39: el front (`test`) manda `entries: [{ label, value }]` en
 * `POST /charts/notes` y `PUT /charts/notes/:noteId/versions`. Sin declarar
 * `entries`, `whitelist + forbidNonWhitelisted` responde 400 a cada nota.
 *
 * Se valida contra los DTO reales con las mismas opciones que el
 * `ValidationPipe` global de `main.ts`.
 */

const PATIENT = '22222222-2222-4222-8222-222222222222';

type Cuerpo = Record<string, unknown>;

/**
 * Aplana los errores (anidados incluidos) a rutas `prop.indice.prop`.
 *
 * @param errores - Errores devueltos por `validate`.
 * @param prefijo - Ruta del padre.
 * @returns Las rutas con error, ordenadas.
 */
function rutasConError(
  errores: readonly ValidationError[],
  prefijo = '',
): string[] {
  return errores
    .flatMap((e) => {
      const ruta = prefijo ? `${prefijo}.${e.property}` : e.property;
      return e.children?.length ? rutasConError(e.children, ruta) : [ruta];
    })
    .sort();
}

/**
 * Transforma y valida un cuerpo como lo hace el pipe global.
 *
 * @param cls - DTO destino.
 * @param cuerpo - Cuerpo JSON.
 * @returns La instancia transformada y las rutas con error.
 */
async function validar<T extends object>(
  cls: new () => T,
  cuerpo: Cuerpo,
): Promise<{ dto: T; errores: string[] }> {
  const dto = plainToInstance(cls, cuerpo, { enableImplicitConversion: true });
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errores: rutasConError(errores) };
}

const filas = [
  { label: 'Presión arterial', value: '120/80 mmHg' },
  { label: 'Peso', value: '70 kg' },
];

describe.each([
  ['CreateNoteDto', CreateNoteDto, { patientProfileId: PATIENT }],
  ['AddVersionDto', AddVersionDto, {}],
] as const)('%s · entries (P39)', (_nombre, cls, base) => {
  const conFilas = (entries: unknown): Cuerpo => ({ ...base, entries });

  it('acepta el cuerpo del front con filas y sin ningún texto', async () => {
    const { errores } = await validar(cls, conFilas(filas));
    expect(errores).toEqual([]);
  });

  it('sigue aceptando el cuerpo sin entries y una lista vacía', async () => {
    expect((await validar(cls, { ...base })).errores).toEqual([]);
    expect((await validar(cls, conFilas([]))).errores).toEqual([]);
  });

  it('recorta etiqueta y valor', async () => {
    const { dto, errores } = await validar(
      cls,
      conFilas([{ label: '  Peso ', value: ' 70 kg  ' }]),
    );
    expect(errores).toEqual([]);
    expect((dto as { entries?: unknown }).entries).toEqual([
      { label: 'Peso', value: '70 kg' },
    ]);
  });

  it.each([
    ['etiqueta vacía', { label: '', value: 'x' }, 'entries.0.label'],
    ['etiqueta sólo espacios', { label: '   ', value: 'x' }, 'entries.0.label'],
    ['valor vacío', { label: 'Peso', value: '' }, 'entries.0.value'],
    ['valor sólo espacios', { label: 'Peso', value: '  ' }, 'entries.0.value'],
    ['sin etiqueta', { value: 'x' }, 'entries.0.label'],
    ['sin valor', { label: 'Peso' }, 'entries.0.value'],
    ['etiqueta null', { label: null, value: 'x' }, 'entries.0.label'],
    ['valor null', { label: 'Peso', value: null }, 'entries.0.value'],
    [
      'etiqueta de 121',
      { label: 'a'.repeat(121), value: 'x' },
      'entries.0.label',
    ],
    [
      'valor de 2001',
      { label: 'Peso', value: 'a'.repeat(2001) },
      'entries.0.value',
    ],
    [
      'propiedad extra en la fila',
      { label: 'Peso', value: 'x', unit: 'kg' },
      'entries.0.unit',
    ],
  ])('rechaza fila con %s', async (_caso, fila, ruta) => {
    const { errores } = await validar(cls, conFilas([fila]));
    expect(errores).toEqual([ruta]);
  });

  it('un número se convierte a texto, como en todo el pipe global (enableImplicitConversion)', async () => {
    const { dto, errores } = await validar(
      cls,
      conFilas([{ label: 'Peso', value: 70 }]),
    );
    expect(errores).toEqual([]);
    expect((dto as { entries?: unknown }).entries).toEqual([
      { label: 'Peso', value: '70' },
    ]);
  });

  it('acepta los topes exactos: 120 en etiqueta, 2000 en valor', async () => {
    const { errores } = await validar(
      cls,
      conFilas([{ label: 'a'.repeat(120), value: 'b'.repeat(2000) }]),
    );
    expect(errores).toEqual([]);
  });

  it(`acepta ${MAX_NOTE_ENTRIES} filas y rechaza ${MAX_NOTE_ENTRIES + 1}`, async () => {
    const n = (k: number) =>
      Array.from({ length: k }, (_, i) => ({ label: `L${i}`, value: 'v' }));
    expect((await validar(cls, conFilas(n(MAX_NOTE_ENTRIES)))).errores).toEqual(
      [],
    );
    expect(
      (await validar(cls, conFilas(n(MAX_NOTE_ENTRIES + 1)))).errores,
    ).toEqual(['entries']);
  });

  it('rechaza entries que no es lista', async () => {
    const { errores } = await validar(
      cls,
      conFilas({ label: 'a', value: 'b' }),
    );
    expect(errores).toContain('entries');
  });
});
