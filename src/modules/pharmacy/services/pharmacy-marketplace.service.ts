import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import {
  PharmacyMarketplaceRepository,
  type PublishedOffer,
} from '../repositories';
import type {
  PublicMedicationAvailabilityDto,
  PublicMedicationCardDto,
  PublicMedicationOfferDto,
  PublicMedicationPageDto,
} from '../dto';

/** Radio de la Tierra en km, para la distancia en línea recta. */
const EARTH_RADIUS_KM = 6371;

/** Tope por defecto de la vitrina, y el techo que ningún `limit` supera. */
const DEFAULT_CAP = 24;
const MAX_CAP = 60;

/**
 * Grupos terapéuticos por la primera letra del ATC.
 *
 * Es la clasificación anatómica del primer nivel del ATC, que es la única que
 * se puede derivar del código sin una tabla que hoy no existe. Sirve para que
 * la vitrina tenga filtros con sentido clínico —«antiinfecciosos», «aparato
 * cardiovascular»— en vez de una lista alfabética de diecisiete nombres.
 */
const GROUPS_ATC: Readonly<Record<string, string>> = {
  A: 'Aparato digestivo y metabolismo',
  B: 'Sangre y órganos hematopoyéticos',
  C: 'Aparato cardiovascular',
  D: 'Dermatológicos',
  G: 'Aparato genitourinario',
  H: 'Terapia hormonal',
  J: 'Antiinfecciosos',
  L: 'Antineoplásicos',
  M: 'Aparato locomotor',
  N: 'Sistema nervioso',
  P: 'Antiparasitarios',
  R: 'Aparato respiratorio',
  S: 'Órganos de los sentidos',
  V: 'Varios',
};

/** Un punto desde donde medir. */
interface Origin {
  /** Latitud WGS84. */
  lat: number;
  /** Longitud WGS84. */
  lng: number;
}

/**
 * La vitrina pública de medicamentos.
 *
 * ## Qué pantalla sirve, y qué promete
 *
 * `/buscar/medicamentos`: un escaparate de **consulta**, no de compra. Muestra
 * qué se consigue, a qué precio y en qué farmacia cerca — y nada más. No hay
 * reserva ni pedido: AloVida no vende medicamentos y la superficie anónima no
 * expone ningún identificador con el que se pueda construir una compra.
 *
 * ## La ubicación es opcional y no se exige nunca
 *
 * Sin `lat`/`lng` la vitrina funciona igual: las tarjetas salen ordenadas por
 * cuántas farmacias lo tienen, y las distancias viajan en `null`. Con origen,
 * el orden pasa a ser el de la farmacia más cercana. Quien no quiere entregar
 * su ubicación no pierde la pantalla, pierde el orden por cercanía.
 *
 * ## Las distancias son en línea recta y se rotulan así
 *
 * Haversine sobre las coordenadas de la dirección publicada. La ruta real
 * depende de un servicio de mapas que no existe en este sistema, así que
 * prometerla sería mentir; la pantalla dice «en línea recta» en cada número.
 */
@Injectable()
export class PharmacyMarketplaceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Consultas públicas del catálogo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PharmacyMarketplaceRepository,
  ) {}

  /**
   * La vitrina: un medicamento por tarjeta, con su rango de precio y en
   * cuántas farmacias está.
   *
   * @param consultation - Texto, grupo terapéutico, origen y tope.
   * @returns La página de la vitrina y los grupos disponibles.
   */
  async listMedications(consultation: {
    q?: string;
    group?: string;
    origin?: Origin;
    radiusKm?: number;
    limit?: number;
  }): Promise<PublicMedicationPageDto> {
    const em = this.em.fork();
    const offers = await this.repo.findPublishedOffers(em, {
      texto: consultation.q,
    });

    const inScope = this.narrowByRadius(
      offers,
      consultation.origin,
      consultation.radiusKm,
    );
    const cards = this.group(inScope, consultation.origin);

    // Los grupos salen de lo que trajo la búsqueda de texto, **antes** de
    // aplicar el grupo elegido. Calcularlos después dejaría en pie sólo el
    // grupo ya elegido y no habría forma de cambiar de idea sin limpiar todo;
    // calcularlos sobre el catálogo entero ofrecería grupos que esa búsqueda
    // no puede llenar, y elegirlos daría una vitrina vacía.
    const groups = [
      ...new Set(offers.map((offer) => grupoDe(offer.atcCode))),
    ].sort((a, b) => a.localeCompare(b, 'es'));

    const filtered =
      consultation.group === undefined || consultation.group === ''
        ? cards
        : cards.filter(
            (tarjeta) => tarjeta.therapeuticGroup === consultation.group,
          );

    const tope = Math.min(
      Math.max(consultation.limit ?? DEFAULT_CAP, 1),
      MAX_CAP,
    );

    return {
      items: filtered.slice(0, tope),
      total: filtered.length,
      groups: groups,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * La disponibilidad de un medicamento, farmacia por farmacia.
   *
   * @param conceptId - Medicamento del vademécum.
   * @param consultation - Origen y radio, los dos opcionales.
   * @returns La ficha y sus ofertas, más cercana primero.
   * @throws ResourceNotFoundException si ninguna farmacia lo publica.
   */
  async getAvailability(
    conceptId: string,
    consultation: { origin?: Origin; radiusKm?: number },
  ): Promise<PublicMedicationAvailabilityDto> {
    const em = this.em.fork();
    const offers = await this.repo.findPublishedOffers(em, { conceptId });

    if (offers.length === 0) {
      // Mismo 404 indistinguible que el resto de la superficie pública: acá
      // nada separa «no existe ese medicamento» de «nadie lo publica».
      throw new ResourceNotFoundException('Medicamento no encontrado', {
        conceptId,
      });
    }

    // El radio acota las ofertas que se listan, pero la ficha se arma con
    // TODAS: si no, un radio corto diría «desde Bs 80» cuando el precio más
    // bajo del país es Bs 45, y eso es un precio inventado.
    const inScope = this.narrowByRadius(
      offers,
      consultation.origin,
      consultation.radiusKm,
    );
    const [ficha] = this.group(offers, consultation.origin);

    const withDistance = inScope.map((offer) => ({
      oferta: offer,
      distancia: this.distance(offer, consultation.origin),
    }));

    withDistance.sort((a, b) => {
      // Con stock primero: un precio más bajo en una farmacia que hoy no lo
      // tiene no es una mejor opción, es un viaje perdido.
      if (a.oferta.availableQuantity > 0 !== b.oferta.availableQuantity > 0) {
        return a.oferta.availableQuantity > 0 ? -1 : 1;
      }
      if (
        a.distancia !== null &&
        b.distancia !== null &&
        a.distancia !== b.distancia
      ) {
        return a.distancia - b.distancia;
      }
      return Number(a.oferta.price) - Number(b.oferta.price);
    });

    return {
      medication: ficha,
      offers: withDistance.map(({ oferta, distancia }) =>
        this.toOffer(oferta, distancia),
      ),
      generatedAt: new Date().toISOString(),
    };
  }

  /* ---- interno ------------------------------------------------------------ */

  /** Las ofertas dentro del radio; sin origen o sin radio, todas. */
  private narrowByRadius(
    offers: readonly PublishedOffer[],
    origen: Origin | undefined,
    radiusKm: number | undefined,
  ): PublishedOffer[] {
    if (origen === undefined || radiusKm === undefined) return [...offers];
    return offers.filter((offer) => {
      const distance = this.distance(offer, origen);
      return distance !== null && distance <= radiusKm;
    });
  }

  /** Distancia en línea recta al origen, redondeada a un decimal. */
  private distance(
    offer: PublishedOffer,
    origen: Origin | undefined,
  ): number | null {
    if (origen === undefined) return null;
    return Number(
      haversineKm(origen, {
        lat: offer.latitude,
        lng: offer.longitude,
      }).toFixed(1),
    );
  }

  /**
   * Las ofertas agrupadas por medicamento, una tarjeta cada uno.
   *
   * El orden es por cercanía cuando hay origen, y por cobertura cuando no lo
   * hay: sin ubicación, «en cuántas farmacias se consigue» es lo más cercano a
   * «qué tan fácil es conseguirlo».
   */
  private group(
    offers: readonly PublishedOffer[],
    origen: Origin | undefined,
  ): PublicMedicationCardDto[] {
    const byConcept = new Map<string, PublishedOffer[]>();
    for (const offer of offers) {
      const group = byConcept.get(offer.conceptId);
      if (group === undefined) byConcept.set(offer.conceptId, [offer]);
      else group.push(offer);
    }

    const cards = [...byConcept.values()].map((group) => {
      const prices = group.map((offer) => Number(offer.price));
      const distances = group
        .map((offer) => this.distance(offer, origen))
        .filter((distance): distance is number => distance !== null);

      // El rango se toma del texto original y no del número: reformatear
      // `46.00` como `46` pierde el centavo que la farmacia publicó.
      const cheapest = group[prices.indexOf(Math.min(...prices))];
      const mostExpensive = group[prices.indexOf(Math.max(...prices))];

      return {
        conceptId: group[0].conceptId,
        atcCode: group[0].atcCode,
        genericName: group[0].genericName,
        therapeuticGroup: grupoDe(group[0].atcCode),
        brands: unique(group.map((offer) => offer.brandName)),
        presentations: unique(group.map((offer) => presentation(offer))),
        requiresPrescription: group.some(
          (offer) => offer.requiresPrescription,
        ),
        priceFrom: cheapest.price,
        priceTo: mostExpensive.price,
        currency: group[0].currency,
        // Farmacias distintas, no ofertas: la misma farmacia puede publicar
        // dos marcas del mismo genérico y eso sigue siendo una farmacia.
        pharmacyCount: new Set(group.map((offer) => offer.pharmacySlug)).size,
        nearestKm: distances.length === 0 ? null : Math.min(...distances),
      };
    });

    cards.sort((a, b) => {
      if (
        a.nearestKm !== null &&
        b.nearestKm !== null &&
        a.nearestKm !== b.nearestKm
      ) {
        return a.nearestKm - b.nearestKm;
      }
      if (a.pharmacyCount !== b.pharmacyCount)
        return b.pharmacyCount - a.pharmacyCount;
      return a.genericName.localeCompare(b.genericName, 'es');
    });

    return cards;
  }

  /** Una oferta cruda, lista para viajar. */
  private toOffer(
    offer: PublishedOffer,
    distance: number | null,
  ): PublicMedicationOfferDto {
    return {
      pharmacySlug: offer.pharmacySlug,
      pharmacyName: offer.pharmacyName,
      addressText: offer.addressText,
      city: offer.city,
      latitude: offer.latitude,
      longitude: offer.longitude,
      distanceKm: distance,
      brandName: offer.brandName,
      presentation: presentation(offer),
      price: offer.price,
      currency: offer.currency,
      inStock: offer.availableQuantity > 0,
      homeDelivery: offer.homeDelivery,
      pickup: offer.pickup,
      requiresPrescription: offer.requiresPrescription,
    };
  }
}

/* ---- funciones puras ------------------------------------------------------ */

/** El grupo terapéutico de un código ATC, o «Varios» si la letra no está. */
function grupoDe(atcCode: string): string {
  return GROUPS_ATC[atcCode.charAt(0).toUpperCase()] ?? 'Varios';
}

/** «500 mg · Caja x 20 tabletas», con lo que la farmacia publique. */
function presentation(offer: PublishedOffer): string | null {
  const parts = [offer.strengthText, offer.packageSizeText].filter(
    (part): part is string => typeof part === 'string' && part !== '',
  );
  return parts.length === 0 ? null : parts.join(' · ');
}

/** Los valores no vacíos, sin repetir y en orden de aparición. */
function unique(values: readonly (string | null)[]): string[] {
  return [
    ...new Set(
      values.filter(
        (valor): valor is string => typeof valor === 'string' && valor !== '',
      ),
    ),
  ];
}

/** Distancia en línea recta entre dos puntos, en km. */
function haversineKm(from: Origin, hasta: Origin): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(hasta.lat - from.lat);
  const deltaLng = toRadians(hasta.lng - from.lng);
  const cuerda =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(hasta.lat)) *
      Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(cuerda));
}
