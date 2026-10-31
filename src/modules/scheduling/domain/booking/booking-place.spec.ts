import { resolveBookingPlace } from './booking-place';

const perez = {
  spaceIds: ['sala-103', 'sala-201'],
  serviceIds: ['svc-cardio'],
};

describe('resolveBookingPlace (A3: espacio y servicio salen de lo que el doctor realmente tiene)', () => {
  it('un espacio declarado que el doctor atiende se acepta', () => {
    expect(resolveBookingPlace({ careSpaceId: 'sala-103' }, perez)).toEqual({
      careSpaceId: 'sala-103',
      healthcareServiceId: 'svc-cardio',
    });
  });

  it('caso 08: un espacio declarado donde el doctor NO atiende se rechaza', () => {
    expect(
      resolveBookingPlace({ careSpaceId: 'edificio-b-b102' }, perez),
    ).toEqual({ rejected: 'CARE_SPACE_NOT_OF_PRACTITIONER' });
  });

  it('caso 07: un servicio declarado que el doctor no presta se rechaza', () => {
    expect(
      resolveBookingPlace({ healthcareServiceId: 'svc-eco' }, perez),
    ).toEqual({ rejected: 'SERVICE_NOT_OF_PRACTITIONER' });
  });

  it('sin declarar, con un único espacio y servicio, los toma de la agenda del doctor', () => {
    expect(
      resolveBookingPlace(
        {},
        { spaceIds: ['sala-103'], serviceIds: ['svc-cardio'] },
      ),
    ).toEqual({ careSpaceId: 'sala-103', healthcareServiceId: 'svc-cardio' });
  });

  it('con varios espacios no elige: queda vacío y un permiso por ubicación no cubre la cita', () => {
    expect(resolveBookingPlace({}, perez)).toEqual({
      careSpaceId: undefined,
      healthcareServiceId: 'svc-cardio',
    });
  });

  it('N9: un doctor sin servicios propios rechaza el servicio declarado (no lo acepta por defecto)', () => {
    expect(
      resolveBookingPlace(
        { healthcareServiceId: 'svc-x' },
        { spaceIds: [], serviceIds: [] },
      ),
    ).toEqual({ rejected: 'SERVICE_NOT_OF_PRACTITIONER' });
  });

  it('N9: un doctor sin servicios propios y sin declarar deja la cita sin servicio', () => {
    expect(resolveBookingPlace({}, { spaceIds: [], serviceIds: [] })).toEqual({
      careSpaceId: undefined,
      healthcareServiceId: undefined,
    });
  });

  it('un doctor sin espacios asignados rechaza un espacio declarado', () => {
    expect(
      resolveBookingPlace(
        { careSpaceId: 'sala-1' },
        { spaceIds: [], serviceIds: [] },
      ),
    ).toEqual({ rejected: 'CARE_SPACE_NOT_OF_PRACTITIONER' });
  });
});
