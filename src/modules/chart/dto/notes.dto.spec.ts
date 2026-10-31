import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import {
  AddVersionDto,
  AmendNoteDto,
  CosignVersionDto,
  CreateNoteDto,
  SignVersionDto,
} from './notes.dto';

/**
 * Los cuerpos de `POST /charts/notes/:noteId/versions/:versionId/sign` y
 * `…/cosign` contra el DTO real y las mismas opciones del `ValidationPipe`
 * global de `main.ts`. Informe B, C5: la pantalla firma con `{}` y el DTO
 * exigía `signerProfileId`, así que firmar daba 400 siempre. El firmante lo
 * deriva el servidor de la sesión (`ChartNotesService.resolveSigner`).
 */
describe('SignVersionDto / CosignVersionDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  function parse<T>(metatype: new () => T, body: unknown): Promise<T> {
    const metadata: ArgumentMetadata = { type: 'body', metatype };
    return pipe.transform(body, metadata) as Promise<T>;
  }

  it.each([
    ['sign', SignVersionDto],
    ['cosign', CosignVersionDto],
  ] as const)(
    '%s: acepta el cuerpo vacío que manda la pantalla',
    async (_, dto) => {
      await expect(parse(dto, {})).resolves.toBeInstanceOf(dto);
    },
  );

  it.each([
    ['sign', SignVersionDto],
    ['cosign', CosignVersionDto],
  ] as const)('%s: sigue aceptando un perfil declarado', async (_, dto) => {
    const signerProfileId = '0b1f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a69';
    await expect(parse(dto, { signerProfileId })).resolves.toMatchObject({
      signerProfileId,
    });
  });

  it('rechaza un perfil que no es uuid', async () => {
    await expect(
      parse(SignVersionDto, { signerProfileId: 'no-es-uuid' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza una clave que el DTO no declara', async () => {
    await expect(parse(SignVersionDto, { reason: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

/**
 * P39 — las filas campo/valor (`entries`) en los tres cuerpos que escriben
 * una versión. Mismos límites que el simulador del frontend
 * (`medical-notes.handlers.ts`): 40 filas, rótulo ≤ 60, valor ≤ 500, los dos
 * obligatorios tras recortar, sin rótulos repetidos y sin HTML.
 * Datos sintéticos.
 */
describe('entries (P39) en CreateNoteDto / AddVersionDto / AmendNoteDto', () => {
  const pipe = createGlobalValidationPipe();
  const PATIENT = '0b1f6a3e-5d2c-4c8e-9a7b-1e2d3c4b5a69';

  function parse<T>(metatype: new () => T, body: unknown): Promise<T> {
    const metadata: ArgumentMetadata = { type: 'body', metatype };
    return pipe.transform(body, metadata) as Promise<T>;
  }

  /** Los campos rechazados, como los ve el front en `details.fields`. */
  async function rejected(
    metatype: new () => unknown,
    body: unknown,
  ): Promise<{ field: string; constraints: readonly string[] }[]> {
    try {
      await parse(metatype, body);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        details: { fields: { field: string; constraints: string[] }[] };
      };
      return response.details.fields;
    }
    throw new Error('se esperaba un 400');
  }

  const bodies = [
    ['CreateNoteDto', CreateNoteDto, { patientProfileId: PATIENT }],
    ['AddVersionDto', AddVersionDto, {}],
    ['AmendNoteDto', AmendNoteDto, { amendmentReasonText: 'Motivo' }],
  ] as const;

  it.each(bodies)(
    '%s: acepta filas válidas, las recorta y conserva el orden',
    async (_, dto, base) => {
      const parsed = (await parse(dto as new () => unknown, {
        ...base,
        entries: [
          { label: '  Campo B ', value: ' 2 ' },
          { label: 'Campo A', value: 'PA < 140 y > 90' },
        ],
      })) as { entries: unknown };
      expect(parsed.entries).toEqual([
        { label: 'Campo B', value: '2' },
        { label: 'Campo A', value: 'PA < 140 y > 90' },
      ]);
    },
  );

  it.each(bodies)(
    '%s: sigue aceptando el cuerpo sin filas',
    async (_, dto, base) => {
      await expect(
        parse(dto as new () => unknown, base),
      ).resolves.toBeDefined();
      await expect(
        parse(dto as new () => unknown, { ...base, entries: [] }),
      ).resolves.toBeDefined();
    },
  );

  it('acepta el tope exacto: 40 filas, rótulo de 60 y valor de 500', async () => {
    const entries = Array.from({ length: 40 }, (_, i) => ({
      label: `${String(i).padStart(2, '0')}${'r'.repeat(58)}`,
      value: 'v'.repeat(500),
    }));
    await expect(
      parse(CreateNoteDto, { patientProfileId: PATIENT, entries }),
    ).resolves.toBeDefined();
  });

  it('rechaza 41 filas', async () => {
    const entries = Array.from({ length: 41 }, (_, i) => ({
      label: `Campo ${i}`,
      value: 'v',
    }));
    const fields = await rejected(CreateNoteDto, {
      patientProfileId: PATIENT,
      entries,
    });
    expect(fields).toEqual([
      expect.objectContaining({
        field: 'entries',
        constraints: ['arrayMaxSize'],
      }),
    ]);
  });

  it('rechaza rótulo de 61 y valor de 501, anclados a su fila', async () => {
    const fields = await rejected(AddVersionDto, {
      entries: [
        { label: 'ok', value: 'ok' },
        { label: 'r'.repeat(61), value: 'v'.repeat(501) },
      ],
    });
    expect(fields.map((f) => [f.field, f.constraints])).toEqual([
      ['entries.1.label', ['maxLength']],
      ['entries.1.value', ['maxLength']],
    ]);
  });

  it('rechaza rótulo o valor vacío después de recortar', async () => {
    const fields = await rejected(AddVersionDto, {
      entries: [{ label: '   ', value: '\n' }],
    });
    expect(fields.map((f) => [f.field, f.constraints])).toEqual([
      ['entries.0.label', ['isNotEmpty']],
      ['entries.0.value', ['isNotEmpty']],
    ]);
  });

  it('rechaza dos filas con el mismo campo sin distinguir mayúsculas ni tildes', async () => {
    const fields = await rejected(CreateNoteDto, {
      patientProfileId: PATIENT,
      entries: [
        { label: 'Presión Arterial', value: '1' },
        { label: 'presion arterial', value: '2' },
      ],
    });
    expect(fields).toEqual([
      expect.objectContaining({
        field: 'entries',
        constraints: ['arrayUnique'],
      }),
    ]);
  });

  it.each([
    ['<b>negrita</b>'],
    ['<script>alert(1)</script>'],
    ['texto <img src=x onerror=y>'],
    ['<!-- comentario'],
    ['control\u0007'],
  ])('rechaza marcado o control en el valor: %j', async (value) => {
    const fields = await rejected(AddVersionDto, {
      entries: [{ label: 'Campo', value }],
    });
    expect(fields).toEqual([
      expect.objectContaining({
        field: 'entries.0.value',
        constraints: ['isPlainText'],
      }),
    ]);
  });

  it('rechaza claves de fila no declaradas y tipos que no son texto', async () => {
    const fields = await rejected(AddVersionDto, {
      // Un número se convierte a texto por `enableImplicitConversion` del pipe
      // global; `null` no, y lo rechaza `@IsString`.
      entries: [{ label: 'Campo', value: null, extra: true }],
    });
    expect(fields.map((f) => f.field).sort()).toEqual([
      'entries.0.extra',
      'entries.0.value',
    ]);
  });

  it('rechaza entries que no es arreglo', async () => {
    const fields = await rejected(AddVersionDto, { entries: 'Campo: valor' });
    expect(fields[0]).toEqual(expect.objectContaining({ field: 'entries' }));
  });
});
