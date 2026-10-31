import { orderSupportDoctors } from './support-doctors-order';

describe('orderSupportDoctors', () => {
  it('ordena por nombre sin acentos ni mayúsculas', () => {
    const ordered = orderSupportDoctors([
      { practitionerProfileId: 'c', displayName: 'Valeria Rojas' },
      { practitionerProfileId: 'a', displayName: 'Ángela Pérez' },
      { practitionerProfileId: 'b', displayName: 'andrés Pérez' },
    ]);
    expect(ordered.map((d) => d.practitionerProfileId)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('a igual nombre desempata por perfil y no muta la entrada', () => {
    const input = [
      { practitionerProfileId: 'z', displayName: 'Ana' },
      { practitionerProfileId: 'a', displayName: 'Ana' },
    ];
    const ordered = orderSupportDoctors(input);
    expect(ordered.map((d) => d.practitionerProfileId)).toEqual(['a', 'z']);
    expect(input[0].practitionerProfileId).toBe('z');
  });
});
