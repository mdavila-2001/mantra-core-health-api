import dataset from './data/bolivia/health-facilities.dataset.json';
import type { BoliviaFacilitySeed } from './bolivia-facilities.catalog';

/**
 * El padrón del que un médico elige dónde trabaja.
 *
 * Es la lista que alimenta `LinkableOrganizationsService`, y por eso importa lo
 * que NO tiene: un lugar que falte acá es un lugar que su médico no puede
 * declarar. Hasta la versión 1.0.0 era sólo el listado oficial del Ministerio,
 * y las redes de las aseguradoras nombran 148 clínicas de las que apenas 12
 * estaban ahí — el resto son consultorios privados y centros chicos que ese
 * listado nunca iba a tener.
 */
describe('el padrón de establecimientos', () => {
  const facilities = (dataset as { datos: BoliviaFacilitySeed[] }).datos;

  /** Cómo se decide que dos nombres son el mismo lugar. */
  function clave(nombre: string): string {
    const withoutAccents = nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase();
    return withoutAccents
      .replace(
        /\b(CLINICA|CENTRO|MEDICO|MEDICA|HOSPITAL|INSTITUTO|SRL|SA|LTDA|DE|DEL|LA|EL|LOS|LAS|Y)\b/g,
        ' ',
      )
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim();
  }

  it('trae el listado oficial y los consultorios de las redes', () => {
    const official = facilities.filter(
      (f) => f.naturaleza !== 'RED_ASEGURADORA',
    );
    const ofNetworks = facilities.filter(
      (f) => f.naturaleza === 'RED_ASEGURADORA',
    );

    expect(official).toHaveLength(523);
    expect(ofNetworks.length).toBeGreaterThan(100);
  });

  /**
   * El motivo por el que los consultorios se agregaron: sin ellos el médico de
   * «CLINICA AOD» no tiene qué elegir.
   */
  it('los consultorios que las redes nombran son elegibles', () => {
    const names = new Set(facilities.map((f) => clave(f.nombre)));

    for (const expected of ['CLINICA AOD', 'NUTRICOR', 'NEOMEDIC']) {
      expect(names.has(clave(expected))).toBe(true);
    }
  });

  /**
   * «CLINICA DE LAS AMERICAS» en la red y «LAS AMERICAS» en el padrón son el
   * mismo lugar: sumarlo daría dos opciones para lo mismo, que es justo lo que
   * una lista cerrada viene a evitar.
   *
   * Se compara sólo red contra oficial, a propósito. **Dentro** del listado
   * oficial hay 33 nombres que colapsan entre sí, y no todos son un error:
   * «SAN PEDRO» son cuatro centros de salud de primer nivel en municipios
   * distintos, y ahí el nombre repetido es el dato. Arreglar eso es otro
   * trabajo —pide desempatar por municipio— y no es lo que este cambio tocó.
   */
  it('ningún consultorio de red repite un lugar del listado oficial', () => {
    const official = new Set(
      facilities
        .filter((f) => f.naturaleza !== 'RED_ASEGURADORA')
        .map((f) => clave(f.nombre)),
    );
    const repeated = facilities
      .filter((f) => f.naturaleza === 'RED_ASEGURADORA')
      .filter((f) => official.has(clave(f.nombre)))
      .map((f) => f.nombre);

    expect(repeated).toEqual([]);
  });

  /** Y entre ellos tampoco: el mismo consultorio nombrado por las dos redes es uno. */
  it('los consultorios de red no se repiten entre sí', () => {
    const claves = facilities
      .filter((f) => f.naturaleza === 'RED_ASEGURADORA')
      .map((f) => clave(f.nombre));

    expect(new Set(claves).size).toBe(claves.length);
  });

  it('cada código es único: es la identidad del lugar', () => {
    const codes = facilities.map((f) => f.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  /**
   * El nombre de un consultorio de red lo leímos nosotros del final de la
   * dirección. La dirección es el dato de verdad, así que ninguno puede venir
   * sin ella.
   */
  it('todo consultorio de red conserva su dirección completa', () => {
    const withoutAddress = facilities
      .filter((f) => f.naturaleza === 'RED_ASEGURADORA')
      .filter((f) => !f.direccion || f.direccion.trim() === '');

    expect(withoutAddress).toEqual([]);
  });
});
