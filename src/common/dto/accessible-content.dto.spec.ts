import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import {
  ACCESSIBLE_CONTENT_LIMITS,
  pickAccessibleContent,
} from './accessible-content.dto';
import {
  CreateFileDto,
  FileCategory,
  FileSensitivity,
  UploadFileDto,
} from '../../modules/common/dto';
import { CreateDiagnosticReportDto } from '../../modules/clinical/dto/diagnostic-report.dto';

/**
 * Aplana los errores de `class-validator` a los nombres de propiedad con error.
 *
 * @param errores - Errores devueltos por `validate`.
 * @returns Las propiedades con error, sin repetidos y ordenadas.
 */
function propiedadesConError(errores: readonly ValidationError[]): string[] {
  return [...new Set(errores.map((e) => e.property))].sort();
}

/** Las tres DTO de alta que heredan los textos, con su cuerpo mínimo válido. */
const ALTAS = [
  {
    nombre: 'CreateFileDto',
    clase: CreateFileDto,
    base: {
      originalName: 'rx-torax.png',
      category: FileCategory.IMAGE,
      sensitivity: FileSensitivity.PHI,
      mimeType: 'image/png',
      sizeBytes: 10,
      contentHash: 'abc',
      storageUri: 'file://local/abc',
    },
  },
  {
    nombre: 'UploadFileDto',
    clase: UploadFileDto,
    base: { category: FileCategory.IMAGE, sensitivity: FileSensitivity.PHI },
  },
  {
    nombre: 'CreateDiagnosticReportDto',
    clase: CreateDiagnosticReportDto,
    base: {
      custodianTenantId: '11111111-1111-4111-8111-111111111111',
      patientProfileId: '22222222-2222-4222-8222-222222222222',
      codeConceptId: '33333333-3333-4333-8333-333333333333',
    },
  },
] as const;

/**
 * Valida un cuerpo contra la DTO con las mismas opciones del `ValidationPipe`
 * global (lista blanca estricta).
 */
async function validar(
  clase: new () => object,
  cuerpo: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(clase, cuerpo);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propiedadesConError(errores);
}

describe.each(ALTAS)(
  '$nombre — textos accesibles (v4.2.33)',
  ({ clase, base }) => {
    // Correcto
    it('acepta el cuerpo sin ninguno de los tres textos (son opcionales)', async () => {
      expect(await validar(clase, { ...base })).toEqual([]);
    });

    it('acepta los tres textos dentro del tope', async () => {
      expect(
        await validar(clase, {
          ...base,
          altText: 'Radiografía de tórax, proyección frontal.',
          description:
            'Silueta cardíaca de tamaño normal. Senos costofrénicos libres.',
          transcription: 'Informe dictado: sin hallazgos agudos.',
        }),
      ).toEqual([]);
    });

    // Límite
    it('acepta cada texto con el largo exacto del tope', async () => {
      expect(
        await validar(clase, {
          ...base,
          altText: 'a'.repeat(ACCESSIBLE_CONTENT_LIMITS.altText),
          description: 'd'.repeat(ACCESSIBLE_CONTENT_LIMITS.description),
          transcription: 't'.repeat(ACCESSIBLE_CONTENT_LIMITS.transcription),
        }),
      ).toEqual([]);
    });

    it('acepta la cadena vacía (imagen decorativa: alt="" a propósito)', async () => {
      expect(await validar(clase, { ...base, altText: '' })).toEqual([]);
    });

    // Inválido
    it('rechaza cada texto con un carácter más que el tope', async () => {
      expect(
        await validar(clase, {
          ...base,
          altText: 'a'.repeat(ACCESSIBLE_CONTENT_LIMITS.altText + 1),
          description: 'd'.repeat(ACCESSIBLE_CONTENT_LIMITS.description + 1),
          transcription: 't'.repeat(
            ACCESSIBLE_CONTENT_LIMITS.transcription + 1,
          ),
        }),
      ).toEqual(['altText', 'description', 'transcription']);
    });

    it('rechaza un texto que no es cadena', async () => {
      expect(
        await validar(clase, {
          ...base,
          altText: 123,
          description: { html: '<b>x</b>' },
          transcription: ['a'],
        }),
      ).toEqual(['altText', 'description', 'transcription']);
    });
  },
);

describe('ACCESSIBLE_CONTENT_LIMITS', () => {
  it('coincide con los CHECK del parche v4.2.33', () => {
    // Si cambia uno sin el otro, la API deja pasar lo que la base rechaza
    // (500 en vez de 400) o rechaza lo que la base aceptaría.
    expect(ACCESSIBLE_CONTENT_LIMITS).toEqual({
      altText: 500,
      description: 4000,
      transcription: 100_000,
    });
  });
});

describe('pickAccessibleContent', () => {
  it('copia los tres textos presentes', () => {
    expect(
      pickAccessibleContent({
        altText: 'alt',
        description: 'desc',
        transcription: 'trans',
      }),
    ).toEqual({ altText: 'alt', description: 'desc', transcription: 'trans' });
  });

  it('omite los que la base devolvió null o no existen', () => {
    const r = pickAccessibleContent({ altText: null, description: 'desc' });
    expect(r).toEqual({ description: 'desc' });
    expect('altText' in r).toBe(false);
    expect('transcription' in r).toBe(false);
  });

  it('conserva la cadena vacía: no es lo mismo que «no declarado»', () => {
    expect(pickAccessibleContent({ altText: '' })).toEqual({ altText: '' });
  });
});
