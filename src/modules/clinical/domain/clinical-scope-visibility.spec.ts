import { visibleWhere, type ScopeFilter } from './clinical-scope-visibility';

const FILTER: ScopeFilter = {
  profileIds: ['hp-1', 'hp-2'],
  userIds: ['u-1'],
  encounterIds: ['enc-1'],
};

describe('visibleWhere', () => {
  it('une lo siempre visible, el responsable y el encuentro de los registros sin responsable', () => {
    const where = visibleWhere(
      FILTER,
      { profile: 'prescriberProfileId', encounter: 'encounterId' },
      [{ statusConceptId: 'ACTIVE' }],
    );

    expect(where).toEqual({
      $or: [
        { statusConceptId: 'ACTIVE' },
        { prescriberProfileId: { $in: ['hp-1', 'hp-2'] } },
        { prescriberProfileId: null, encounterId: { $in: ['enc-1'] } },
      ],
    });
  });

  it('una sección que solo guarda la cuenta usa la cuenta, y sin responsable el encuentro', () => {
    const where = visibleWhere(FILTER, {
      user: 'recordedByUserId',
      encounter: 'encounterId',
    });

    expect(where).toEqual({
      $or: [
        { recordedByUserId: { $in: ['u-1'] } },
        { recordedByUserId: null, encounterId: { $in: ['enc-1'] } },
      ],
    });
  });

  it('una sección con perfil y cuenta exige que ninguno de los dos esté para caer al encuentro', () => {
    const where = visibleWhere(FILTER, {
      profile: 'authorProfileId',
      user: 'createdByUserId',
      encounter: 'encounterId',
    });

    expect(where.$or).toContainEqual({
      authorProfileId: null,
      createdByUserId: null,
      encounterId: { $in: ['enc-1'] },
    });
  });

  it('omite las cláusulas que no tienen con qué compararse (listas vacías)', () => {
    const where = visibleWhere(
      { profileIds: ['hp-1'], userIds: [], encounterIds: [] },
      { profile: 'authorProfileId', user: 'createdByUserId', encounter: 'e' },
    );

    expect(where).toEqual({
      $or: [{ authorProfileId: { $in: ['hp-1'] } }],
    });
  });

  it('sin nada visible no devuelve un OR vacío: devuelve una condición que nunca se cumple', () => {
    const where = visibleWhere(
      { profileIds: [], userIds: [], encounterIds: [] },
      { profile: 'authorProfileId', encounter: 'encounterId' },
    );

    expect(where).toEqual({ id: null });
  });

  it('lo siempre visible sigue visible aunque no haya ningún profesional autorizado', () => {
    const where = visibleWhere(
      { profileIds: [], userIds: [], encounterIds: [] },
      { profile: 'authorProfileId' },
      [{ clinicalStatusConceptId: { $in: ['ACTIVE'] } }],
    );

    expect(where).toEqual({
      $or: [{ clinicalStatusConceptId: { $in: ['ACTIVE'] } }],
    });
  });

  it('no comparte referencias con el filtro: mutar el resultado no altera el filtro', () => {
    const where = visibleWhere(FILTER, { profile: 'p' }) as any;
    where.$or[0].p.$in.push('intruso');
    expect(FILTER.profileIds).toEqual(['hp-1', 'hp-2']);
  });
});
