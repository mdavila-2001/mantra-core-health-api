import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { PharmacyMarketplaceService } from './pharmacy-marketplace.service';
import type { OfertaPublicada } from '../repositories';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/* ---- geografía de las pruebas --------------------------------------------- */

const SANTA_CRUZ = { lat: -17.7833, lng: -63.1821 };
/** A ~2 km de la plaza: la farmacia del barrio. */
const CERCA = { lat: -17.7833, lng: -63.2021 };
/** Cochabamba: a ~320 km, fuera de cualquier radio urbano. */
const LEJOS = { lat: -17.3895, lng: -66.1568 };

/** Una oferta publicada, con lo mínimo y lo que cada prueba cambie. */
function oferta(extra: Partial<OfertaPublicada> = {}): OfertaPublicada {
  return {
    conceptId: 'concepto-losartan',
    atcCode: 'C09CA01',
    genericName: 'Losartán',
    pharmacySlug: 'farmacia-una',
    pharmacyName: 'Farmacia Una',
    addressText: 'Av. Siempreviva 742',
    city: 'Santa Cruz de la Sierra',
    latitude: CERCA.lat,
    longitude: CERCA.lng,
    brandName: 'Cozaar',
    strengthText: '50 mg',
    packageSizeText: 'Caja x 30 comprimidos',
    price: '78.00',
    currency: 'BOB',
    availableQuantity: 12,
    homeDelivery: true,
    pickup: true,
    requiresPrescription: true,
    ...extra,
  };
}

function build(ofertas: readonly OfertaPublicada[] = []) {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = { findPublishedOffers: mockFn().mockResolvedValue([...ofertas]) };
  const service = new PharmacyMarketplaceService(em as any, repo as any);
  return { service, repo };
}

describe('PharmacyMarketplaceService · la vitrina', () => {
  it('agrupa las ofertas por medicamento: una tarjeta, no una por farmacia', async () => {
    const { service } = build([
      oferta({ pharmacySlug: 'a', price: '78.00' }),
      oferta({ pharmacySlug: 'b', price: '92.00' }),
      oferta({ pharmacySlug: 'c', price: '67.00' }),
    ]);

    const pagina = await service.listMedications({});

    expect(pagina.items).toHaveLength(1);
    expect(pagina.items[0].pharmacyCount).toBe(3);
  });

  it('cuenta farmacias distintas, no ofertas: dos marcas en la misma son una', async () => {
    const { service } = build([
      oferta({ pharmacySlug: 'a', brandName: 'Cozaar' }),
      oferta({ pharmacySlug: 'a', brandName: 'Losacor' }),
    ]);

    const pagina = await service.listMedications({});

    expect(pagina.items[0].pharmacyCount).toBe(1);
    expect(pagina.items[0].brands).toEqual(['Cozaar', 'Losacor']);
  });

  it('el rango de precio conserva el texto exacto que publicó la farmacia', async () => {
    const { service } = build([
      oferta({ pharmacySlug: 'a', price: '46.00' }),
      oferta({ pharmacySlug: 'b', price: '61.03' }),
    ]);

    const [tarjeta] = (await service.listMedications({})).items;

    // `46.00` y no `46`: reformatear por `number` pierde el centavo, que es
    // justamente el dato que la vitrina promete mostrar sin tocar.
    expect(tarjeta.priceFrom).toBe('46.00');
    expect(tarjeta.priceTo).toBe('61.03');
  });

  it('deriva el grupo terapéutico del primer nivel del ATC', async () => {
    const { service } = build([
      oferta({ atcCode: 'C09CA01' }),
      oferta({ conceptId: 'c-amoxi', atcCode: 'J01CA04', genericName: 'Amoxicilina' }),
    ]);

    const pagina = await service.listMedications({});

    expect(pagina.groups).toEqual(['Antiinfecciosos', 'Aparato cardiovascular']);
  });

  it('sin origen no inventa distancias y ordena por cobertura', async () => {
    const { service } = build([
      oferta({ conceptId: 'poco', genericName: 'Vancomicina', pharmacySlug: 'a' }),
      oferta({ conceptId: 'mucho', genericName: 'Paracetamol', pharmacySlug: 'a' }),
      oferta({ conceptId: 'mucho', genericName: 'Paracetamol', pharmacySlug: 'b' }),
    ]);

    const pagina = await service.listMedications({});

    expect(pagina.items[0].genericName).toBe('Paracetamol');
    expect(pagina.items.every((item) => item.nearestKm === null)).toBe(true);
  });

  it('con origen ordena por cercanía y rotula la distancia más corta', async () => {
    const { service } = build([
      oferta({ conceptId: 'lejano', genericName: 'Vancomicina', ...coord(LEJOS) }),
      oferta({ conceptId: 'cercano', genericName: 'Paracetamol', ...coord(CERCA) }),
    ]);

    const pagina = await service.listMedications({ origin: SANTA_CRUZ });

    expect(pagina.items[0].genericName).toBe('Paracetamol');
    expect(pagina.items[0].nearestKm).toBeLessThan(5);
  });

  it('el radio deja afuera lo que está lejos, y sólo cuando hay origen', async () => {
    const ofertas = [
      oferta({ conceptId: 'lejano', genericName: 'Vancomicina', ...coord(LEJOS) }),
      oferta({ conceptId: 'cercano', genericName: 'Paracetamol', ...coord(CERCA) }),
    ];

    const acotada = await build(ofertas).service.listMedications({
      origin: SANTA_CRUZ,
      radiusKm: 25,
    });
    expect(acotada.items.map((item) => item.genericName)).toEqual(['Paracetamol']);

    // Sin origen el radio no puede aplicarse: no hay desde dónde medir.
    const sinOrigen = await build(ofertas).service.listMedications({ radiusKm: 25 });
    expect(sinOrigen.items).toHaveLength(2);
  });

  it('los grupos ofrecidos no se achican al elegir uno: se puede cambiar de idea', async () => {
    const { service } = build([
      oferta({ conceptId: 'cardio', atcCode: 'C09CA01' }),
      oferta({ conceptId: 'anti', atcCode: 'J01CA04', genericName: 'Amoxicilina' }),
    ]);

    const pagina = await service.listMedications({ group: 'Antiinfecciosos' });

    expect(pagina.items.map((item) => item.genericName)).toEqual(['Amoxicilina']);
    expect(pagina.groups).toEqual(['Antiinfecciosos', 'Aparato cardiovascular']);
  });

  it('recorta el tope al máximo y nunca lo deja en cero', async () => {
    const muchas = Array.from({ length: 80 }, (_, i) =>
      oferta({ conceptId: `c-${i}`, genericName: `Medicamento ${i}` }),
    );

    const { service } = build(muchas);

    expect((await service.listMedications({ limit: 999 })).items).toHaveLength(60);
    expect((await service.listMedications({ limit: 0 })).items).toHaveLength(1);
    // `total` cuenta lo que cumple el filtro, no lo que entró en la página.
    expect((await service.listMedications({ limit: 5 })).total).toBe(80);
  });
});

describe('PharmacyMarketplaceService · la disponibilidad', () => {
  it('404 cuando ninguna farmacia lo publica: no distingue de «no existe»', async () => {
    const { service } = build([]);

    await expect(service.getAvailability('concepto-fantasma', {})).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('pone primero lo que hay en stock, aunque haya algo más barato agotado', async () => {
    const { service } = build([
      oferta({ pharmacySlug: 'barata-sin-stock', price: '50.00', availableQuantity: 0 }),
      oferta({ pharmacySlug: 'cara-con-stock', price: '90.00', availableQuantity: 4 }),
    ]);

    const { offers } = await service.getAvailability('concepto-losartan', {});

    expect(offers.map((o) => o.pharmacySlug)).toEqual([
      'cara-con-stock',
      'barata-sin-stock',
    ]);
    expect(offers[1].inStock).toBe(false);
  });

  it('no esconde la oferta agotada: la publica y dice que no hay stock', async () => {
    const { service } = build([oferta({ availableQuantity: 0 })]);

    const { offers } = await service.getAvailability('concepto-losartan', {});

    expect(offers).toHaveLength(1);
    expect(offers[0].inStock).toBe(false);
    expect(offers[0].price).toBe('78.00');
  });

  it('la ficha se arma con TODAS las ofertas, aunque el radio recorte la lista', async () => {
    const { service } = build([
      oferta({ pharmacySlug: 'cerca', price: '90.00', ...coord(CERCA) }),
      oferta({ pharmacySlug: 'lejos', price: '45.00', ...coord(LEJOS) }),
    ]);

    const resultado = await service.getAvailability('concepto-losartan', {
      origin: SANTA_CRUZ,
      radiusKm: 25,
    });

    // La lista se acota, pero «desde Bs 45» sigue siendo cierto del país: un
    // rango calculado sólo sobre lo cercano sería un precio inventado.
    expect(resultado.offers.map((o) => o.pharmacySlug)).toEqual(['cerca']);
    expect(resultado.medication.priceFrom).toBe('45.00');
  });

  it('compone la presentación con lo que la farmacia publique, y nada más', async () => {
    const { service } = build([
      oferta({ pharmacySlug: 'completa' }),
      oferta({ pharmacySlug: 'parcial', strengthText: '50 mg', packageSizeText: null }),
      oferta({ pharmacySlug: 'vacia', strengthText: null, packageSizeText: null }),
    ]);

    const { offers } = await service.getAvailability('concepto-losartan', {});
    const porSlug = new Map(offers.map((o) => [o.pharmacySlug, o.presentation]));

    expect(porSlug.get('completa')).toBe('50 mg · Caja x 30 comprimidos');
    expect(porSlug.get('parcial')).toBe('50 mg');
    expect(porSlug.get('vacia')).toBeNull();
  });

  it('sin origen las distancias viajan en null, no en cero', async () => {
    const { service } = build([oferta()]);

    const { offers } = await service.getAvailability('concepto-losartan', {});

    expect(offers[0].distanceKm).toBeNull();
  });
});

/** Las coordenadas de un punto, con los nombres que usa la oferta. */
function coord(punto: { lat: number; lng: number }) {
  return { latitude: punto.lat, longitude: punto.lng };
}
