import { coordinatesFromMapLink } from './map-link-coordinates';

describe('coordinatesFromMapLink', () => {
  const cases: [string, string, [number, number]][] = [
    [
      'google pin (!3d!4d) beats the viewport',
      'https://www.google.com/maps/place/Clinica/@-16.5001,-68.1502,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-16.5123!4d-68.1234',
      [-16.5123, -68.1234],
    ],
    [
      'google viewport',
      'https://www.google.com/maps/@-16.5,-68.15,15z',
      [-16.5, -68.15],
    ],
    [
      'google q=lat,lng (url-encoded comma)',
      'https://maps.google.com/?q=-16.5%2C-68.15',
      [-16.5, -68.15],
    ],
    [
      'openstreetmap #map',
      'https://www.openstreetmap.org/#map=17/-16.5/-68.15',
      [-16.5, -68.15],
    ],
    [
      'openstreetmap marker',
      'https://www.openstreetmap.org/?mlat=-16.5&mlon=-68.15#map=17/-16/-68',
      [-16.5, -68.15],
    ],
  ];

  it.each(cases)('reads %s', (_name, link, [latitude, longitude]) => {
    expect(coordinatesFromMapLink(link)).toEqual({ latitude, longitude });
  });

  it('returns undefined for a short link or a place name', () => {
    expect(
      coordinatesFromMapLink('https://maps.app.goo.gl/uwjxPfc6SYBhtQ3e7'),
    ).toBeUndefined();
    expect(
      coordinatesFromMapLink('https://www.google.com/maps/place/La+Paz'),
    ).toBeUndefined();
  });

  it('rejects out-of-range values', () => {
    expect(
      coordinatesFromMapLink('https://www.google.com/maps/@-116.5,-68.15,15z'),
    ).toBeUndefined();
  });
});
