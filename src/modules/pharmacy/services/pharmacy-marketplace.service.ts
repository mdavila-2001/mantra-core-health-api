import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import {
  PharmacyMarketplaceRepository,
  type OfertaPublicada,
} from '../repositories';
import type {
  PublicMedicationAvailabilityDto,
  PublicMedicationCardDto,
  PublicMedicationOfferDto,
  PublicMedicationPageDto,
} from '../dto';

/** Radio de la Tierra en km, para la distancia en línea recta. */
const RADIO_TERRESTRE_KM = 6371;

/** Tope por defecto de la vitrina, y el techo que ningún `limit` supera. */
const TOPE_POR_DEFECTO = 24;
const TOPE_MAXIMO = 60;

/**
 * Grupos terapéuticos por la primera letra del ATC.
 *
 * Es la clasificación anatómica del primer nivel del ATC, que es la única que
 * se puede derivar del código sin una tabla que hoy no existe. Sirve para que
 * la vitrina tenga filtros con sentido clínico —«antiinfecciosos», «aparato
 * cardiovascular»— en vez de una lista alfabética de diecisiete nombres.
 */
const GRUPOS_ATC: Readonly<Record<string, string>> = {
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
interface Origen {
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
   * @param consulta - Texto, grupo terapéutico, origen y tope.
   * @returns La página de la vitrina y los grupos disponibles.
   */
  async listMedications(consulta: {
    q?: string;
    group?: string;
    origin?: Origen;
    radiusKm?: number;
    limit?: number;
  }): Promise<PublicMedicationPageDto> {
    const em = this.em.fork();
    const ofertas = await this.repo.findPublishedOffers(em, {
      texto: consulta.q,
    });

    const enAlcance = this.acotarPorRadio(
      ofertas,
      consulta.origin,
      consulta.radiusKm,
    );
    const tarjetas = this.agrupar(enAlcance, consulta.origin);

    // Los grupos salen de lo que trajo la búsqueda de texto, **antes** de
    // aplicar el grupo elegido. Calcularlos después dejaría en pie sólo el
    // grupo ya elegido y no habría forma de cambiar de idea sin limpiar todo;
    // calcularlos sobre el catálogo entero ofrecería grupos que esa búsqueda
    // no puede llenar, y elegirlos daría una vitrina vacía.
    const grupos = [
      ...new Set(ofertas.map((oferta) => grupoDe(oferta.atcCode))),
    ].sort((a, b) => a.localeCompare(b, 'es'));

    const filtradas =
      consulta.group === undefined || consulta.group === ''
        ? tarjetas
        : tarjetas.filter(
            (tarjeta) => tarjeta.therapeuticGroup === consulta.group,
          );

    const tope = Math.min(
      Math.max(consulta.limit ?? TOPE_POR_DEFECTO, 1),
      TOPE_MAXIMO,
    );

    return {
      items: filtradas.slice(0, tope),
      total: filtradas.length,
      groups: grupos,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * La disponibilidad de un medicamento, farmacia por farmacia.
   *
   * @param conceptId - Medicamento del vademécum.
   * @param consulta - Origen y radio, los dos opcionales.
   * @returns La ficha y sus ofertas, más cercana primero.
   * @throws ResourceNotFoundException si ninguna farmacia lo publica.
   */
  async getAvailability(
    conceptId: string,
    consulta: { origin?: Origen; radiusKm?: number },
  ): Promise<PublicMedicationAvailabilityDto> {
    const em = this.em.fork();
    const ofertas = await this.repo.findPublishedOffers(em, { conceptId });

    if (ofertas.length === 0) {
      // Mismo 404 indistinguible que el resto de la superficie pública: acá
      // nada separa «no existe ese medicamento» de «nadie lo publica».
      throw new ResourceNotFoundException('Medicamento no encontrado', {
        conceptId,
      });
    }

    // El radio acota las ofertas que se listan, pero la ficha se arma con
    // TODAS: si no, un radio corto diría «desde Bs 80» cuando el precio más
    // bajo del país es Bs 45, y eso es un precio inventado.
    const enAlcance = this.acotarPorRadio(
      ofertas,
      consulta.origin,
      consulta.radiusKm,
    );
    const [ficha] = this.agrupar(ofertas, consulta.origin);

    const conDistancia = enAlcance.map((oferta) => ({
      oferta,
      distancia: this.distanciaDe(oferta, consulta.origin),
    }));

    conDistancia.sort((a, b) => {
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
      offers: conDistancia.map(({ oferta, distancia }) =>
        this.aOferta(oferta, distancia),
      ),
      generatedAt: new Date().toISOString(),
    };
  }

  /* ---- interno ------------------------------------------------------------ */

  /** Las ofertas dentro del radio; sin origen o sin radio, todas. */
  private acotarPorRadio(
    ofertas: readonly OfertaPublicada[],
    origen: Origen | undefined,
    radiusKm: number | undefined,
  ): OfertaPublicada[] {
    if (origen === undefined || radiusKm === undefined) return [...ofertas];
    return ofertas.filter((oferta) => {
      const distancia = this.distanciaDe(oferta, origen);
      return distancia !== null && distancia <= radiusKm;
    });
  }

  /** Distancia en línea recta al origen, redondeada a un decimal. */
  private distanciaDe(
    oferta: OfertaPublicada,
    origen: Origen | undefined,
  ): number | null {
    if (origen === undefined) return null;
    return Number(
      haversineKm(origen, {
        lat: oferta.latitude,
        lng: oferta.longitude,
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
  private agrupar(
    ofertas: readonly OfertaPublicada[],
    origen: Origen | undefined,
  ): PublicMedicationCardDto[] {
    const porConcepto = new Map<string, OfertaPublicada[]>();
    for (const oferta of ofertas) {
      const grupo = porConcepto.get(oferta.conceptId);
      if (grupo === undefined) porConcepto.set(oferta.conceptId, [oferta]);
      else grupo.push(oferta);
    }

    const tarjetas = [...porConcepto.values()].map((grupo) => {
      const precios = grupo.map((oferta) => Number(oferta.price));
      const distancias = grupo
        .map((oferta) => this.distanciaDe(oferta, origen))
        .filter((distancia): distancia is number => distancia !== null);

      // El rango se toma del texto original y no del número: reformatear
      // `46.00` como `46` pierde el centavo que la farmacia publicó.
      const masBarata = grupo[precios.indexOf(Math.min(...precios))];
      const masCara = grupo[precios.indexOf(Math.max(...precios))];

      return {
        conceptId: grupo[0].conceptId,
        atcCode: grupo[0].atcCode,
        genericName: grupo[0].genericName,
        therapeuticGroup: grupoDe(grupo[0].atcCode),
        brands: unicos(grupo.map((oferta) => oferta.brandName)),
        presentations: unicos(grupo.map((oferta) => presentacionDe(oferta))),
        requiresPrescription: grupo.some(
          (oferta) => oferta.requiresPrescription,
        ),
        priceFrom: masBarata.price,
        priceTo: masCara.price,
        currency: grupo[0].currency,
        // Farmacias distintas, no ofertas: la misma farmacia puede publicar
        // dos marcas del mismo genérico y eso sigue siendo una farmacia.
        pharmacyCount: new Set(grupo.map((oferta) => oferta.pharmacySlug)).size,
        nearestKm: distancias.length === 0 ? null : Math.min(...distancias),
      };
    });

    tarjetas.sort((a, b) => {
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

    return tarjetas;
  }

  /** Una oferta cruda, lista para viajar. */
  private aOferta(
    oferta: OfertaPublicada,
    distancia: number | null,
  ): PublicMedicationOfferDto {
    return {
      pharmacySlug: oferta.pharmacySlug,
      pharmacyName: oferta.pharmacyName,
      addressText: oferta.addressText,
      city: oferta.city,
      latitude: oferta.latitude,
      longitude: oferta.longitude,
      distanceKm: distancia,
      brandName: oferta.brandName,
      presentation: presentacionDe(oferta),
      price: oferta.price,
      currency: oferta.currency,
      inStock: oferta.availableQuantity > 0,
      homeDelivery: oferta.homeDelivery,
      pickup: oferta.pickup,
      requiresPrescription: oferta.requiresPrescription,
    };
  }
}

/* ---- funciones puras ------------------------------------------------------ */

/** El grupo terapéutico de un código ATC, o «Varios» si la letra no está. */
function grupoDe(atcCode: string): string {
  return GRUPOS_ATC[atcCode.charAt(0).toUpperCase()] ?? 'Varios';
}

/** «500 mg · Caja x 20 tabletas», con lo que la farmacia publique. */
function presentacionDe(oferta: OfertaPublicada): string | null {
  const partes = [oferta.strengthText, oferta.packageSizeText].filter(
    (parte): parte is string => typeof parte === 'string' && parte !== '',
  );
  return partes.length === 0 ? null : partes.join(' · ');
}

/** Los valores no vacíos, sin repetir y en orden de aparición. */
function unicos(valores: readonly (string | null)[]): string[] {
  return [
    ...new Set(
      valores.filter(
        (valor): valor is string => typeof valor === 'string' && valor !== '',
      ),
    ),
  ];
}

/** Distancia en línea recta entre dos puntos, en km. */
function haversineKm(desde: Origen, hasta: Origen): number {
  const aRadianes = (grados: number): number => (grados * Math.PI) / 180;
  const deltaLat = aRadianes(hasta.lat - desde.lat);
  const deltaLng = aRadianes(hasta.lng - desde.lng);
  const cuerda =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(aRadianes(desde.lat)) *
      Math.cos(aRadianes(hasta.lat)) *
      Math.sin(deltaLng / 2) ** 2;
  return 2 * RADIO_TERRESTRE_KM * Math.asin(Math.sqrt(cuerda));
}
