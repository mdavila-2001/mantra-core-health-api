import { ForbiddenException } from '@nestjs/common';
import {
  assertNoteAuthoredByActor,
  resolveNoteAuthor,
  resolveNoteSigner,
} from './chart-note-identity';

const clinician = {
  id: 'u1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;
const superadmin = { id: 'root', roles: ['SUPERADMIN'] } as any;

describe('resolveNoteAuthor / resolveNoteSigner', () => {
  it('el autor y el firmante son el perfil de la sesión', () => {
    expect(resolveNoteAuthor(undefined, clinician)).toBe('hp-1');
    expect(resolveNoteSigner('hp-1', clinician)).toBe('hp-1');
  });

  it('nadie escribe ni firma en nombre de otro perfil', () => {
    expect(() => resolveNoteAuthor('hp-2', clinician)).toThrow(
      ForbiddenException,
    );
    expect(() => resolveNoteSigner('hp-2', clinician)).toThrow(
      ForbiddenException,
    );
  });

  it('sin perfil profesional en la sesión no hay autor', () => {
    expect(() =>
      resolveNoteAuthor(undefined, { id: 'u', roles: ['PRACTITIONER'] } as any),
    ).toThrow(ForbiddenException);
  });

  it('el SUPERADMIN declara el perfil, y sin declarar ni tener uno no hay autor', () => {
    expect(resolveNoteAuthor('hp-7', superadmin)).toBe('hp-7');
    expect(() => resolveNoteSigner(undefined, superadmin)).toThrow(
      ForbiddenException,
    );
  });
});

describe('assertNoteAuthoredByActor (regla c)', () => {
  it('el autor modifica su propia nota', () => {
    expect(() => assertNoteAuthoredByActor('hp-1', clinician)).not.toThrow();
  });

  it('otro profesional no modifica lo que escribió el autor', () => {
    expect(() => assertNoteAuthoredByActor('hp-2', clinician)).toThrow(
      /Sólo el autor/,
    );
  });

  it('una sesión sin perfil profesional no puede reclamar una nota con autor', () => {
    expect(() =>
      assertNoteAuthoredByActor('hp-2', {
        id: 'u',
        roles: ['CLINICIAN'],
      } as any),
    ).toThrow(ForbiddenException);
  });

  it('una versión sin autor registrado no bloquea', () => {
    expect(() => assertNoteAuthoredByActor(undefined, clinician)).not.toThrow();
    expect(() => assertNoteAuthoredByActor(null, clinician)).not.toThrow();
  });

  it('el SUPERADMIN global pasa; el acotado a un tenant no', () => {
    expect(() => assertNoteAuthoredByActor('hp-2', superadmin)).not.toThrow();
    expect(() =>
      assertNoteAuthoredByActor('hp-2', {
        id: 'a',
        roles: ['SUPERADMIN'],
        scopedRoles: { t: ['SUPERADMIN'] },
        practitionerProfileId: 'hp-9',
      } as any),
    ).toThrow(ForbiddenException);
  });
});
