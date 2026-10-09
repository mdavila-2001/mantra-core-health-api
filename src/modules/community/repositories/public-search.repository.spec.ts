import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  PublicSearchRepository,
  publicSitesOf,
  type SitePublicRow,
} from './public-search.repository';
import { PRAC } from '../../practice/practice.concepts';
import { PROF } from '../../profiles/profiles.concepts';

const DOCTOR = 'profesional-dra';
const OTHER_PROFESSIONAL = 'profesional-otro';
const DOCTOR_ACCOUNT = 'cuenta-dra';
const FOREIGN_ACCOUNT = 'cuenta-ajena';

/**
 * Una fila de la consulta: asignación vigente de la Dra. en una clínica ajena,
 * con dirección completa y su vínculo de cuenta activo. Cada prueba cambia sólo
 * lo que quiere refutar.
 *
 * @param partial - Los campos que la prueba sobrescribe.
 * @returns La fila completa.
 */
function row(partial: Partial<SitePublicRow> = {}): SitePublicRow {
  return {
    practitioner_profile_id: DOCTOR,
    assignment_status_concept_id: PRAC.ROLE_ASSIGNMENT_ACTIVE,
    assignment_valid_to: null,
    site_id: 'sede-clinica',
    site_name: 'Clínica Los Olivos',
    practice_type_concept_id: PRAC.PRACTICE_TYPE_CLINIC,
    practice_admin_user_id: 'admin-clinica',
    lines: 'Av. Arce 2345',
    city: 'La Paz',
    postal_code: null,
    latitude: '-16.5000000',
    longitude: '-68.1300000',
    link_user_id: DOCTOR_ACCOUNT,
    link_status_concept_id: PROF.ACCOUNT_LINK_ACTIVE,
    ...partial,
  };
}

/** La práctica personal de la Dra.: consultorio administrado por su cuenta. */
const OWN_OFFICE: Partial<SitePublicRow> = {
  site_id: 'sede-propia',
  site_name: 'Consultorio Dra. Quispe',
  practice_type_concept_id: PRAC.PRACTICE_TYPE_OFFICE,
  practice_admin_user_id: DOCTOR_ACCOUNT,
};

/**
 * Las sedes que la regla le asigna a la Dra.
 *
 * @param rows - Filas de la consulta.
 * @returns Sus sedes, o `[]` si no tiene ninguna.
 */
function doctorSites(rows: SitePublicRow[]) {
  return publicSitesOf(rows).get(DOCTOR) ?? [];
}

describe('sedesPublicasDe — dónde atiende, para la ficha pública', () => {
  describe('qué asignación cuenta', () => {
    it('B · N sedes vigentes distintas dan N sedes', () => {
      const sites = doctorSites([
        row({ site_id: 'sede-1' }),
        row({ site_id: 'sede-2' }),
        row({ site_id: 'sede-3' }),
      ]);

      expect(sites.map((s) => s.id)).toEqual(['sede-1', 'sede-2', 'sede-3']);
    });

    it('dos asignaciones vigentes en la misma sede son un solo lugar', () => {
      const sites = doctorSites([row(), row()]);

      expect(sites).toHaveLength(1);
    });

    it('F · una asignación finalizada no aparece', () => {
      const sites = doctorSites([
        row({
          site_id: 'sede-finalizada',
          assignment_status_concept_id: PRAC.ROLE_ASSIGNMENT_ENDED,
        }),
        row({ site_id: 'sede-vigente' }),
      ]);

      expect(sites.map((s) => s.id)).toEqual(['sede-vigente']);
    });

    it('F · una asignación ACTIVE con valid_to cargado no aparece', () => {
      // `findCurrentWithSite` exige las dos cosas: estado activo y `valid_to`
      // nulo. Un estado activo con fin cargado no es «atiende hoy».
      const sites = doctorSites([row({ assignment_valid_to: '2026-09-01' })]);

      expect(sites).toEqual([]);
    });

    it('F · quien sólo tiene asignaciones no vigentes no figura en el mapa', () => {
      const map = publicSitesOf([
        row({ assignment_status_concept_id: PRAC.ROLE_ASSIGNMENT_ENDED }),
      ]);

      expect(map.has(DOCTOR)).toBe(false);
    });
  });

  describe('qué sede es propia', () => {
    it('C · consultorio administrado por la cuenta activa del profesional → isOwn', () => {
      const [sede] = doctorSites([row(OWN_OFFICE)]);

      expect(sede.isOwn).toBe(true);
    });

    it('D · consultorio administrado por OTRA cuenta → no es propio', () => {
      const [sede] = doctorSites([
        row({ ...OWN_OFFICE, practice_admin_user_id: FOREIGN_ACCOUNT }),
      ]);

      expect(sede.isOwn).toBe(false);
    });

    it('D · consultorio administrado por una cuenta cuyo vínculo ya no está activo → no es propio', () => {
      const [sede] = doctorSites([
        row({
          ...OWN_OFFICE,
          link_status_concept_id: PROF.ACCOUNT_LINK_SUPERSEDED,
        }),
      ]);

      expect(sede.isOwn).toBe(false);
    });

    it('D · profesional sin ningún vínculo de cuenta → nada es propio', () => {
      const [sede] = doctorSites([
        row({
          ...OWN_OFFICE,
          link_user_id: null,
          link_status_concept_id: null,
        }),
      ]);

      expect(sede.isOwn).toBe(false);
    });

    it('E · práctica diagnóstica administrada por la propia cuenta → no es propia', () => {
      // El peor caso para una regla floja: el alta de unidades diagnósticas
      // crea la sede con `SITE_TYPE_OFFICE` y deja como administradora a la
      // cuenta dueña. La fila ni siquiera trae el tipo de sede —la regla no lo
      // mira—; lo que la separa es el tipo de práctica.
      const [sede] = doctorSites([
        row({
          ...OWN_OFFICE,
          practice_type_concept_id: PRAC.PRACTICE_TYPE_DIAGNOSTIC_CENTER,
        }),
      ]);

      expect(sede.isOwn).toBe(false);
    });

    it('administrar una clínica no la vuelve consultorio propio', () => {
      const [sede] = doctorSites([
        row({ practice_admin_user_id: DOCTOR_ACCOUNT }),
      ]);

      expect(sede.isOwn).toBe(false);
    });

    it('el vínculo activo cuenta aunque llegue en la fila de otra asignación', () => {
      // El vínculo es de la persona: que la fila del consultorio traiga el
      // vínculo viejo y otra fila traiga el activo no cambia de quién es.
      const [sede] = doctorSites([
        row({
          ...OWN_OFFICE,
          link_status_concept_id: PROF.ACCOUNT_LINK_SUPERSEDED,
        }),
        row({
          site_id: 'sede-finalizada',
          assignment_status_concept_id: PRAC.ROLE_ASSIGNMENT_ENDED,
        }),
      ]);

      expect(sede).toMatchObject({ id: 'sede-propia', isOwn: true });
    });

    it('la cuenta de un profesional no vuelve propio el consultorio de otro', () => {
      const map = publicSitesOf([
        row(),
        row({
          ...OWN_OFFICE,
          practitioner_profile_id: OTHER_PROFESSIONAL,
          link_user_id: 'cuenta-del-otro',
        }),
      ]);

      expect(map.get(OTHER_PROFESSIONAL)?.[0].isOwn).toBe(false);
      expect(map.get(DOCTOR)?.map((s) => s.id)).toEqual(['sede-clinica']);
    });
  });

  describe('orden', () => {
    it('G · el consultorio propio va primero aunque su id ordene después', () => {
      const sites = doctorSites([
        row({ site_id: 'a-clinica' }),
        row({ ...OWN_OFFICE, site_id: 'z-propia' }),
      ]);

      expect(sites.map((s) => [s.id, s.isOwn])).toEqual([
        ['z-propia', true],
        ['a-clinica', false],
      ]);
    });

    it('entre iguales el orden es por id de sede, venga como venga la consulta', () => {
      const rows = [
        row({ site_id: 'c-clinica' }),
        row({ ...OWN_OFFICE, site_id: 'y-propia' }),
        row({ site_id: 'a-clinica' }),
        row({ ...OWN_OFFICE, site_id: 'b-propia' }),
      ];

      const ids = doctorSites(rows).map((s) => s.id);
      const reversed = doctorSites([...rows].reverse()).map((s) => s.id);

      expect(ids).toEqual(['b-propia', 'y-propia', 'a-clinica', 'c-clinica']);
      expect(reversed).toEqual(ids);
    });
  });

  describe('dirección y punto', () => {
    it('H · sede sin dirección: addressText y location nulos, sin error', () => {
      const [sede] = doctorSites([
        row({
          lines: null,
          city: null,
          postal_code: null,
          latitude: null,
          longitude: null,
        }),
      ]);

      expect(sede).toEqual({
        id: 'sede-clinica',
        name: 'Clínica Los Olivos',
        addressText: null,
        location: null,
        isOwn: false,
      });
    });

    it('la dirección se compone calle, ciudad y código postal, sin partes vacías', () => {
      const [sede] = doctorSites([
        row({ lines: '  Calle Sucre 45 ', city: '', postal_code: '0000' }),
      ]);

      expect(sede.addressText).toBe('Calle Sucre 45, 0000');
    });

    it('las coordenadas numeric llegan como número', () => {
      const [sede] = doctorSites([row()]);

      expect(sede.location).toEqual({ lat: -16.5, lng: -68.13 });
    });

    it('media coordenada no es un lugar: location nulo, dirección intacta', () => {
      const [sede] = doctorSites([row({ longitude: null })]);

      expect(sede.location).toBeNull();
      expect(sede.addressText).toBe('Av. Arce 2345, La Paz');
    });
  });
});

describe('PublicSearchRepository.practiceSitesByPractitioner', () => {
  /**
   * Construye el repositorio con una conexión que devuelve `filas`.
   *
   * @param rows - Lo que devolverá la consulta.
   * @returns El repositorio, el `em` y el doble de `execute`.
   */
  function build(rows: SitePublicRow[] = []) {
    const execute = mockFn(async () => rows);
    const em = { getConnection: mockFn(() => ({ execute })) };
    return { repo: new PublicSearchRepository(), em, execute };
  }

  it('sin sujetos no consulta', async () => {
    const d = build();

    const map = await d.repo.practiceSitesByPractitioner(d.em as any, []);

    expect(map.size).toBe(0);
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('una sola consulta, acotada a los sujetos pedidos y sin otro parámetro', async () => {
    const d = build();

    await d.repo.practiceSitesByPractitioner(d.em as any, [DOCTOR]);

    expect(d.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = d.execute.mock.calls[0];
    // El único parámetro es la lista de sujetos: ni tenant ni nada que abra la
    // lectura a quien la ficha no resolvió.
    expect(params).toEqual([[DOCTOR]]);
    expect(sql).toContain('WHERE pra.practitioner_profile_id IN (?)');
    expect(sql).toContain('JOIN practice.practice_sites ps');
    expect(sql).toContain('JOIN practice.practices p');
    expect(sql).toContain('LEFT JOIN common.addresses a');
    expect(sql).toContain('LEFT JOIN profiles.person_account_links pal');
    expect(sql).not.toMatch(/tenant/i);
  });

  it('devuelve lo que la regla decide sobre las filas', async () => {
    const d = build([
      row({ site_id: 'a-clinica' }),
      row({ ...OWN_OFFICE, site_id: 'z-propia' }),
    ]);

    const map = await d.repo.practiceSitesByPractitioner(d.em as any, [DOCTOR]);

    expect(map.get(DOCTOR)?.map((s) => s.id)).toEqual([
      'z-propia',
      'a-clinica',
    ]);
  });
});
