import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

import { UpdateOwnPatientProfileDto } from './update-own-patient-profile.dto';

/**
 * Aplana el árbol de `ValidationError` a rutas `a.b.c`, igual que hace el
 * `ValidationPipe` de Nest (`prependConstraintsWithParentProp`). Copiado de
 * `iam/dto/register-practitioner.dto.spec.ts`, que fija el mismo patrón para
 * el alta: este DTO es su espejo de edición y merece la misma forma de
 * prueba, no una reinventada.
 *
 * @param errores - Los errores devueltos por `validate()`.
 * @param prefijo - La ruta acumulada hasta este nivel.
 * @returns Las rutas de las propiedades con error, ordenadas y sin repetidos.
 */
function rutasConError(
  errores: readonly ValidationError[],
  prefijo = '',
): string[] {
  const rutas: string[] = [];
  for (const error of errores) {
    const ruta = prefijo ? `${prefijo}.${error.property}` : error.property;
    if (error.constraints) rutas.push(ruta);
    if (error.children && error.children.length > 0) {
      rutas.push(...rutasConError(error.children, ruta));
    }
  }
  return [...new Set(rutas)].sort();
}

/**
 * Valida un cuerpo de `PATCH /profiles/patients/me` y devuelve las rutas que
 * quedaron mal.
 *
 * `enableImplicitConversion: true` reproduce `transformOptions` del
 * `ValidationPipe` real de `main.ts`: sin esto, una latitud que llega como
 * `"-17.78"` en un cuerpo JSON de verdad se comporta distinto que acá, y la
 * prueba estaría afirmando un pipe que no es el que corre en producción.
 *
 * @param cuerpo - El cuerpo del PATCH, tal como llegaría del cliente.
 * @returns Las rutas con error (`homeLatitude`, `workLongitude`…).
 */
async function propiedadesConError(
  cuerpo: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(UpdateOwnPatientProfileDto, cuerpo, {
    enableImplicitConversion: true,
  });
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return rutasConError(errores);
}

/**
 * `UpdateOwnPatientProfileDto` — el par de coordenadas de domicilio y de
 * trabajo (subtarea B.2).
 *
 * No hay un spec de este DTO en el repo pese a que el DoD del carril lo
 * exige: las cuatro reglas de forma (rango, par ambos-o-ninguno, `null`
 * quita, un eje no contamina al otro) sólo estaban probadas indirectamente,
 * a través de `profiles-patients.service.spec.ts` con el DTO mockeado como
 * `any`. Acá se ejercita el `ValidationPipe` real.
 */
describe('UpdateOwnPatientProfileDto · coordenadas de domicilio y trabajo', () => {
  it('un cuerpo vacío es válido: es un PATCH, nada que tocar', async () => {
    expect(await propiedadesConError({})).toEqual([]);
  });

  describe.each([
    ['home', 'homeLatitude', 'homeLongitude'],
    ['work', 'workLatitude', 'workLongitude'],
  ] as const)('eje %s', (_eje, latKey, lngKey) => {
    it('acepta un par válido', async () => {
      expect(
        await propiedadesConError({ [latKey]: -17.7833, [lngKey]: -63.1821 }),
      ).toEqual([]);
    });

    it('rechaza una latitud fuera de [-90, 90]', async () => {
      expect(
        await propiedadesConError({ [latKey]: 91, [lngKey]: -63.1821 }),
      ).toEqual([latKey]);
    });

    it('rechaza una longitud fuera de [-180, 180]', async () => {
      expect(
        await propiedadesConError({ [latKey]: -17.7833, [lngKey]: 181 }),
      ).toEqual([lngKey]);
    });

    /**
     * Media coordenada no ubica nada: el `ValidateIf` de las dos propiedades
     * se activa con que UNA de las dos venga definida, así que la ausente
     * cae en `@IsNumber()` sobre `undefined` y falla también — el error
     * aparece en la que falta, no en la que sí llegó con un valor válido.
     */
    it('sólo la latitud: la longitud ausente es el error, no la latitud', async () => {
      expect(await propiedadesConError({ [latKey]: -17.7833 })).toEqual([
        lngKey,
      ]);
    });

    it('sólo la longitud: la latitud ausente es el error, no la longitud', async () => {
      expect(await propiedadesConError({ [lngKey]: -63.1821 })).toEqual([
        latKey,
      ]);
    });

    it('null en los dos extremos quita el punto: es válido', async () => {
      expect(
        await propiedadesConError({ [latKey]: null, [lngKey]: null }),
      ).toEqual([]);
    });

    it('null en uno solo es un par incoherente: rechazado', async () => {
      const rutas = await propiedadesConError({
        [latKey]: null,
        [lngKey]: -63.1821,
      });
      expect(rutas.length).toBeGreaterThan(0);
    });
  });

  it('un eje inválido no contamina la validación del otro', async () => {
    expect(
      await propiedadesConError({
        homeLatitude: 91,
        homeLongitude: -63.1821,
        workLatitude: -16.5,
        workLongitude: -68.15,
      }),
    ).toEqual(['homeLatitude']);
  });

  it('quitar un eje y declarar el otro conviven en el mismo cuerpo', async () => {
    expect(
      await propiedadesConError({
        homeLatitude: null,
        homeLongitude: null,
        workLatitude: -16.5,
        workLongitude: -68.15,
      }),
    ).toEqual([]);
  });
});
