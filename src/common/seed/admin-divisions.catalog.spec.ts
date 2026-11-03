import {
  ADMIN_DIVISIONS_BY_COUNTRY,
  adminDivisionByConceptId,
  adminDivisionLineage,
  allAdminDivisions,
  boProvinceConceptId,
} from './admin-divisions.catalog';
import {
  BO_DEPARTMENTS,
  BO_MUNICIPALITIES,
  boDepartmentConceptId,
  boMunicipalityConceptId,
} from './bo-geography.catalog';

describe('catálogo de divisiones administrativas (ADR-0028)', () => {
  const bolivia = ADMIN_DIVISIONS_BY_COUNTRY.BO();

  describe('correcto', () => {
    it('Bolivia: 9 departamentos, 112 provincias y 340 municipios', () => {
      const porNivel = (nivel: number) =>
        bolivia.filter((d) => d.level === nivel).length;
      expect(porNivel(1)).toBe(BO_DEPARTMENTS.length);
      expect(porNivel(1)).toBe(9);
      expect(porNivel(2)).toBe(112);
      expect(porNivel(3)).toBe(BO_MUNICIPALITIES.length);
      expect(porNivel(3)).toBe(340);
    });

    it('reusa los conceptos de departamento y municipio: no los duplica', () => {
      const scz = adminDivisionByConceptId(boDepartmentConceptId('SC'));
      expect(scz).toMatchObject({ level: 1, ownsConcept: false });
      const sucre = adminDivisionByConceptId(boMunicipalityConceptId('010101'));
      expect(sucre).toMatchObject({ level: 3, ownsConcept: false });
      // Sólo las provincias son conceptos nuevos.
      expect(
        bolivia.filter((d) => d.ownsConcept).every((d) => d.level === 2),
      ).toBe(true);
    });

    it('del municipio deduce provincia, departamento y país', () => {
      // Santa Cruz de la Sierra: INE 070101 → provincia Andrés Ibáñez (0701).
      expect(adminDivisionLineage(boMunicipalityConceptId('070101'))).toEqual({
        country: 'BO',
        level1ConceptId: boDepartmentConceptId('SC'),
        level2ConceptId: boProvinceConceptId('0701'),
        level3ConceptId: boMunicipalityConceptId('070101'),
      });
      expect(adminDivisionByConceptId(boProvinceConceptId('0701'))?.name).toBe(
        'Andrés Ibáñez',
      );
    });

    it('todo padre existe y es exactamente del nivel anterior', () => {
      for (const division of allAdminDivisions()) {
        if (division.level === 1) {
          expect(division.parentConceptId).toBeNull();
          continue;
        }
        const padre = adminDivisionByConceptId(division.parentConceptId!);
        expect(padre).toBeDefined();
        expect(padre!.level).toBe(division.level - 1);
        expect(padre!.country).toBe(division.country);
      }
    });
  });

  describe('límite', () => {
    it('las cuatro provincias «Cercado» son conceptos distintos, cada una en su departamento', () => {
      const cercados = bolivia.filter(
        (d) => d.level === 2 && d.name === 'Cercado',
      );
      expect(cercados).toHaveLength(4);
      expect(new Set(cercados.map((d) => d.conceptId)).size).toBe(4);
      expect(new Set(cercados.map((d) => d.parentConceptId)).size).toBe(4);
    });

    it('ids y códigos únicos en todo el catálogo', () => {
      const todas = allAdminDivisions();
      expect(new Set(todas.map((d) => d.conceptId)).size).toBe(todas.length);
      expect(new Set(todas.map((d) => d.conceptCode)).size).toBe(todas.length);
    });

    it('los ids son estables: la misma provincia da siempre el mismo id', () => {
      expect(boProvinceConceptId('0701')).toBe(boProvinceConceptId('0701'));
      expect(boProvinceConceptId('0701')).not.toBe(boProvinceConceptId('0702'));
    });

    it('desde una provincia, el linaje no tiene nivel 3', () => {
      expect(adminDivisionLineage(boProvinceConceptId('0201'))).toEqual({
        country: 'BO',
        level1ConceptId: boDepartmentConceptId('LP'),
        level2ConceptId: boProvinceConceptId('0201'),
      });
    });
  });

  describe('inválido', () => {
    it('un id que no es una división no tiene linaje', () => {
      expect(
        adminDivisionLineage('00000000-0000-0000-0000-000000000000'),
      ).toBeUndefined();
      expect(adminDivisionByConceptId('no-es-un-uuid')).toBeUndefined();
    });
  });
});
