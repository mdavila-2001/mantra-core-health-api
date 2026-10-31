import {
  ATOM_CATEGORIES,
  LEGACY_PRIMARY,
  PERMISSION_ATOMS,
  PERMISSION_ATOM_BY_CODE,
} from '../delegated_access/domain/support-permission-catalog';
import { SUPPORT_ACTIONS } from '../delegated_access/domain/support-actions';
import {
  PERMISSION_CATEGORY_SEED,
  PLATFORM_PERMISSION_SEED,
} from './authz.seed';

/**
 * Dos copias del mismo catálogo no pueden divergir: el dominio puro
 * (`support-permission-catalog.ts`) decide con él y la semilla de arranque lo
 * escribe en `authz.permissions`. Si alguien cambia la sensibilidad o una
 * obligación en uno y no en el otro, la política decide con una cosa y la
 * pantalla de permisos muestra otra.
 */
describe('semilla de arranque ≡ catálogo del dominio', () => {
  const semilla = new Map(PLATFORM_PERMISSION_SEED.map((p) => [p.code, p]));

  it('los mismos 73 átomos, con el mismo id', () => {
    expect(PERMISSION_ATOMS).toHaveLength(73);
    for (const atom of PERMISSION_ATOMS) {
      expect({ code: atom.code, id: semilla.get(atom.code)?.id }).toEqual({
        code: atom.code,
        id: atom.id,
      });
    }
  });

  it.each(PERMISSION_ATOMS.map((a) => [a.code, a] as const))(
    '%s: mismos metadatos de gobierno',
    (code, atom) => {
      const s = semilla.get(code)!;
      expect(s.name).toBe(atom.name);
      expect(s.resource).toBe(atom.resource);
      expect(s.categoryCode).toBe(atom.categoryCode);
      expect(s.fieldLevel).toBe(atom.isFieldLevel);
      expect(s.dangerous).toBe(atom.isDangerous);
      expect(s.governance).toEqual({
        sensitivity: atom.sensitivity,
        requiresReason: atom.requiresReason,
        requiresStepUp: atom.requiresStepUp,
        approvalMode: atom.approvalMode,
        purposeOfUse: atom.purposeOfUse,
        legalBasis: atom.legalBasis,
        touchesClinicalData: atom.touchesClinicalData,
        supportAssignable: atom.supportAssignable,
      });
    },
  );

  it('las mismas 7 categorías, con el mismo nombre', () => {
    expect(PERMISSION_CATEGORY_SEED.map((c) => [c.code, c.name])).toEqual(
      ATOM_CATEGORIES.map((c) => [c.code, c.name]),
    );
  });

  it('cada alias hereda la sensibilidad de su átomo primario', () => {
    for (const code of SUPPORT_ACTIONS) {
      const primario = PERMISSION_ATOM_BY_CODE.get(LEGACY_PRIMARY[code]);
      expect({ code, s: semilla.get(code)?.governance?.sensitivity }).toEqual({
        code,
        s: primario?.sensitivity,
      });
    }
  });
});
