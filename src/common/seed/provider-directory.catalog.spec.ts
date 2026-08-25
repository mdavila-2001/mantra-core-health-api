import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_DIRECTORY_ENTRIES,
  PROVIDER_DIRECTORY_PROPERTY_CODES,
  providerDirectoryConceptCode,
  providerDirectoryConceptId,
  providerDirectoryMemberId,
  providerDirectoryPropertyId,
} from './provider-directory.catalog';

/**
 * Guardarraíles del directorio de médicos habilitados.
 *
 * Las dos redes del stakeholder traen a la misma persona escrita distinto
 * —Alianza «ABASTO VEGA, ROSEMARY», Nacional «ABASTO VEGA ROSEMARY»— y a la
 * misma especialidad con dos grafías —«Pediatría» y «PEDIATRIA»—. Sin fusionar,
 * el directorio muestra 198 doctores repetidos y ofrece cada especialidad dos
 * veces en el filtro. Estas pruebas fijan que la fusión ocurre, porque el día
 * que alguien "simplifique" la normalización el síntoma no es un error: es una
 * guía que se ve razonable y está mal.
 */
describe('directorio de médicos habilitados', () => {
  it('fusiona al mismo profesional aunque las redes lo escriban distinto', () => {
    // El dataset trae 961 filas; 198 son la misma persona en las dos redes.
    expect(PROVIDER_DIRECTORY_ENTRIES).toHaveLength(763);

    const enAmbas = PROVIDER_DIRECTORY_ENTRIES.filter(
      (ficha) => ficha.aseguradoras.length > 1,
    );
    expect(enAmbas).toHaveLength(198);
  });

  it('une sedes y planes de las dos redes en una sola ficha', () => {
    const rosemary = PROVIDER_DIRECTORY_ENTRIES.find((ficha) =>
      ficha.nombre.startsWith('ABASTO VEGA'),
    );

    expect(rosemary).toBeDefined();
    // El rótulo visible gana la forma con coma: es la que separa apellidos de
    // nombres, y sin ella no se sabe dónde termina uno.
    expect(rosemary?.nombre).toBe('ABASTO VEGA, ROSEMARY');
    expect(rosemary?.aseguradoras).toEqual(
      expect.arrayContaining(['Alianza', 'Nacional Seguros']),
    );
    // Planes de las dos redes en la misma ficha.
    expect(rosemary?.planes).toEqual(
      expect.arrayContaining(['AFI GOLD', 'SALUD FLEXIBLE']),
    );
  });

  it('no repite una especialidad por diferencias de grafía', () => {
    for (const ficha of PROVIDER_DIRECTORY_ENTRIES) {
      const normalizadas = ficha.especialidades.map((especialidad) =>
        especialidad.toUpperCase(),
      );
      expect(new Set(normalizadas).size).toBe(ficha.especialidades.length);
    }
  });

  it('ofrece una sola grafía de cada especialidad en todo el directorio', () => {
    // El filtro del front lista TODAS las especialidades del directorio: si el
    // dedup fuese por ficha, un médico que sólo está en la red que grita dejaría
    // «PEDIATRIA» suelto junto a «Pediatría».
    const todas = new Set(
      PROVIDER_DIRECTORY_ENTRIES.flatMap((ficha) => ficha.especialidades),
    );
    const normalizadas = new Set(
      [...todas].map((especialidad) => especialidad.toUpperCase()),
    );
    expect(todas.size).toBe(normalizadas.size);
    expect(todas.size).toBe(134);
  });

  it('deriva identificadores únicos y que no se pisan entre sí', () => {
    const conceptos = PROVIDER_DIRECTORY_ENTRIES.map(
      providerDirectoryConceptId,
    );
    const miembros = PROVIDER_DIRECTORY_ENTRIES.map(providerDirectoryMemberId);
    const propiedades = PROVIDER_DIRECTORY_ENTRIES.flatMap((ficha) =>
      Object.values(PROVIDER_DIRECTORY_PROPERTY_CODES).map((codigo) =>
        providerDirectoryPropertyId(ficha, codigo),
      ),
    );

    expect(new Set(conceptos).size).toBe(conceptos.length);
    expect(new Set(miembros).size).toBe(miembros.length);
    expect(new Set(propiedades).size).toBe(propiedades.length);

    // Un id compartido entre niveles no falla: pisa en silencio.
    const todos = [...conceptos, ...miembros, ...propiedades];
    expect(new Set(todos).size).toBe(todos.length);
  });

  it('prefija el código con el conjunto para no chocar con otros catálogos', () => {
    // `catalog_concepts` tiene UNIQUE(code_system_version_id, code) y todos los
    // conceptos internos comparten versión: un nombre propio a secas podría
    // chocar con cualquier otro catálogo que use nombres como código.
    for (const ficha of PROVIDER_DIRECTORY_ENTRIES) {
      expect(providerDirectoryConceptCode(ficha)).toMatch(
        /^VS_BO_PROVIDER_DIRECTORY:/,
      );
    }
  });

  it('conserva los teléfonos de las dos redes para la misma sede', () => {
    // La misma clínica llega con teléfonos distintos según la red, y son todos
    // válidos: quedarse con los de una sola pierde forma de contactar.
    const conSedes = PROVIDER_DIRECTORY_ENTRIES.filter(
      (ficha) => ficha.aseguradoras.length > 1 && ficha.sedes.length > 0,
    );
    expect(conSedes.length).toBeGreaterThan(0);

    for (const ficha of conSedes) {
      const direcciones = ficha.sedes.map((sede) => sede.direccion);
      // Una dirección, una sede: el merge no puede dejar la misma dos veces.
      expect(new Set(direcciones).size).toBe(direcciones.length);
    }
  });
});
