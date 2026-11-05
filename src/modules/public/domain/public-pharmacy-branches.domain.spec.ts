import {
  BranchProductRow,
  PublicBranchRow,
  availabilityOf,
  cleanPrescriptionItems,
  compareBranchAvailability,
  compareBranches,
  straightLineKm,
  toPublicBranch,
} from './public-pharmacy-branches.domain';

/** Datos sintéticos: ninguna farmacia, sede ni producto de acá es real. */
function siteRow(over: Partial<PublicBranchRow> = {}): PublicBranchRow {
  return {
    siteId: '00000000-0000-4000-8000-0000000000a1',
    siteName: 'Centro',
    pharmacyName: 'Farmacia Sintética',
    addressLines: 'Calle Falsa 123',
    city: 'Santa Cruz',
    latitude: '-17.7833',
    longitude: '-63.1821',
    description: null,
    locationUrl: null,
    ...over,
  };
}

function productRow(over: Partial<BranchProductRow> = {}): BranchProductRow {
  return {
    siteId: '00000000-0000-4000-8000-0000000000a1',
    productId: '00000000-0000-4000-8000-0000000000b1',
    genericName: 'Paracetamol',
    brandName: 'Dolorán',
    strengthText: '500 mg',
    packageSizeText: 'caja x 10',
    searchText: 'Paracetamol Dolorán 500 mg caja x 10',
    price: '4.50',
    currency: 'BOB',
    ...over,
  };
}

describe('P37 · reglas puras de sucursales y receta', () => {
  describe('cleanPrescriptionItems', () => {
    it('quita vacíos y repetidos sin tildes, conserva el orden y el texto escrito', () => {
      expect(
        cleanPrescriptionItems([
          ' Losartán ',
          '',
          'losartan',
          '   ',
          'Paracetamol',
        ]),
      ).toEqual(['Losartán', 'Paracetamol']);
    });
  });

  describe('toPublicBranch', () => {
    it('nombra «cadena · sucursal», con el punto como número y sin teléfono inventado', () => {
      const branch = toPublicBranch(siteRow(), 'farmacia-sintetica', false);
      expect(branch).toEqual({
        id: '00000000-0000-4000-8000-0000000000a1',
        slug: 'farmacia-sintetica',
        name: 'Farmacia Sintética · Centro',
        siteName: 'Centro',
        city: 'Santa Cruz',
        addressText: 'Calle Falsa 123',
        phone: null,
        openingHours: null,
        description: null,
        locationUrl: null,
        location: { lat: -17.7833, lng: -63.1821 },
        locationAccuracy: null,
        isCurrent: false,
      });
    });

    it('la única sucursal es la de la ficha (isCurrent)', () => {
      expect(toPublicBranch(siteRow(), 's', true).isCurrent).toBe(true);
    });

    it('límite: sin punto completo no hay location; un punto fuera de rango tampoco', () => {
      expect(
        toPublicBranch(siteRow({ longitude: null }), 's', false).location,
      ).toBeNull();
      expect(
        toPublicBranch(siteRow({ latitude: '123' }), 's', false).location,
      ).toBeNull();
    });

    it('inválido: un enlace que no es http(s) no se publica', () => {
      expect(
        toPublicBranch(
          siteRow({ locationUrl: 'javascript:alert(1)' }),
          's',
          false,
        ).locationUrl,
      ).toBeNull();
      expect(
        toPublicBranch(
          siteRow({ locationUrl: 'https://maps.example/x' }),
          's',
          false,
        ).locationUrl,
      ).toBe('https://maps.example/x');
    });

    it('no repite la cadena cuando la sede ya la nombra', () => {
      expect(
        toPublicBranch(
          siteRow({ siteName: 'Farmacia Sintética Norte' }),
          's',
          false,
        ).name,
      ).toBe('Farmacia Sintética Norte');
    });
  });

  describe('availabilityOf', () => {
    const branch = toPublicBranch(siteRow(), 's', false);

    it('correcto: casa sin tildes, completa, total exacto y distancia en línea recta', () => {
      const result = availabilityOf(
        branch,
        ['paracetamol', 'Losartan'],
        [
          productRow(),
          productRow({
            productId: '00000000-0000-4000-8000-0000000000b2',
            genericName: 'Losartán',
            brandName: null,
            strengthText: '50 mg',
            packageSizeText: null,
            searchText: 'Losartán 50 mg',
            price: '0.10',
          }),
        ],
        { lat: -17.79, lng: -63.18 },
      );
      expect(result.complete).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.matches.map((m) => [m.term, m.genericName])).toEqual([
        ['paracetamol', 'Paracetamol'],
        ['Losartan', 'Losartán'],
      ]);
      expect(result.matches[0].presentation).toBe('500 mg · caja x 10');
      // 4.50 + 0.10 sin coma flotante.
      expect(result.totalAmount).toBe('4.60');
      expect(result.currency).toBe('BOB');
      expect(result.distanceKm).toBe(0.8);
    });

    it('límite: varios casan con un renglón → gana el más barato con precio', () => {
      const result = availabilityOf(
        branch,
        ['paracetamol'],
        [
          productRow({ productId: 'p-sin-precio', price: null }),
          productRow({ productId: 'p-caro', price: '9.00' }),
          productRow({ productId: 'p-barato', price: '3.20' }),
        ],
        null,
      );
      expect(result.matches[0].price).toBe('3.20');
      expect(result.distanceKm).toBeNull();
    });

    it('límite: sin nada encontrado no es completa, todo es faltante y no hay total', () => {
      const result = availabilityOf(branch, ['Ibuprofeno'], [], null);
      expect(result).toMatchObject({
        matches: [],
        missing: ['Ibuprofeno'],
        complete: false,
        totalAmount: null,
        currency: null,
      });
    });

    it('límite: sin renglones nunca es completa', () => {
      expect(availabilityOf(branch, [], [], null).complete).toBe(false);
    });

    it('inválido para sumar: un encontrado sin precio o monedas mezcladas dejan el total en null', () => {
      const sinPrecio = availabilityOf(
        branch,
        ['paracetamol'],
        [productRow({ price: null })],
        null,
      );
      expect(sinPrecio.totalAmount).toBeNull();
      expect(sinPrecio.matches[0].currency).toBeNull();

      const mezcla = availabilityOf(
        branch,
        ['paracetamol', 'losartan'],
        [
          productRow(),
          productRow({
            productId: 'p2',
            genericName: 'Losartán',
            searchText: 'Losartán',
            currency: 'USD',
          }),
        ],
        null,
      );
      expect(mezcla.complete).toBe(true);
      expect(mezcla.totalAmount).toBeNull();
    });
  });

  describe('orden', () => {
    const near = toPublicBranch(
      siteRow({ siteId: 'a', siteName: 'Cerca' }),
      's',
      false,
    );
    const far = toPublicBranch(
      siteRow({
        siteId: 'b',
        siteName: 'Lejos',
        latitude: '-16.5',
        longitude: '-68.15',
      }),
      's',
      false,
    );
    const nowhere = toPublicBranch(
      siteRow({ siteId: 'c', siteName: 'Sin punto', latitude: null }),
      's',
      false,
    );
    const origin = { lat: -17.78, lng: -63.18 };

    it('primero las completas aunque estén lejos; entre iguales, la más cercana; sin punto al final', () => {
      const items = [
        availabilityOf(nowhere, ['paracetamol'], [productRow()], origin),
        availabilityOf(near, ['paracetamol'], [], origin),
        availabilityOf(far, ['paracetamol'], [productRow()], origin),
      ].sort(compareBranchAvailability);
      expect(items.map((item) => item.branch.siteName)).toEqual([
        'Lejos',
        'Sin punto',
        'Cerca',
      ]);
    });

    it('la lista sin receta va por ciudad y nombre, sin ciudad al final', () => {
      const list = [
        toPublicBranch(
          siteRow({ siteId: '1', siteName: 'B', city: null }),
          's',
          false,
        ),
        toPublicBranch(
          siteRow({ siteId: '2', siteName: 'Z', city: 'Cochabamba' }),
          's',
          false,
        ),
        toPublicBranch(
          siteRow({ siteId: '3', siteName: 'A', city: 'Santa Cruz' }),
          's',
          false,
        ),
      ].sort(compareBranches);
      expect(list.map((b) => b.id)).toEqual(['2', '3', '1']);
    });

    it('la distancia es haversine con una decimal', () => {
      expect(straightLineKm(origin, origin)).toBe(0);
      expect(
        straightLineKm(origin, { lat: -16.5, lng: -68.15 }),
      ).toBeGreaterThan(500);
    });
  });
});
