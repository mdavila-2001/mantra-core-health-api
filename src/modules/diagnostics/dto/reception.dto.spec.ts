import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LabInboxQueryDto } from './reception.dto';

/**
 * Valida el cuerpo de la bandeja como lo hace el `ValidationPipe` global.
 *
 * @param body - Cuerpo recibido.
 * @returns Las propiedades con error, ordenadas.
 */
async function errors(body: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(LabInboxQueryDto, body);
  const found = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return [...new Set(found.map((e) => e.property))].sort();
}

describe('LabInboxQueryDto', () => {
  it('correcto: cuerpo vacío (primera página, sin búsqueda)', async () => {
    expect(await errors({})).toEqual([]);
  });

  it('correcto: cursor, tope y búsqueda por paciente', async () => {
    expect(
      await errors({ cursor: 'abc', limit: 50, patientQuery: 'Pérez' }),
    ).toEqual([]);
  });

  it('límite: la búsqueda se recorta antes de medirla', async () => {
    const dto = plainToInstance(LabInboxQueryDto, { patientQuery: '  ana  ' });
    expect(dto.patientQuery).toBe('ana');
    expect(await errors({ patientQuery: ' a ' })).toEqual(['patientQuery']);
  });

  it('límite: tope 1 y 100 se aceptan; 0 y 101 no', async () => {
    expect(await errors({ limit: 1 })).toEqual([]);
    expect(await errors({ limit: 100 })).toEqual([]);
    expect(await errors({ limit: 0 })).toEqual(['limit']);
    expect(await errors({ limit: 101 })).toEqual(['limit']);
  });

  it('inválido: búsqueda demasiado larga, tope no entero y campos ajenos', async () => {
    expect(await errors({ patientQuery: 'x'.repeat(81) })).toEqual([
      'patientQuery',
    ]);
    expect(await errors({ limit: 2.5 })).toEqual(['limit']);
    // Un tenant en el cuerpo no es un filtro: el laboratorio lo pone el contexto.
    expect(await errors({ tenantId: 'otro' })).toEqual(['tenantId']);
  });
});
