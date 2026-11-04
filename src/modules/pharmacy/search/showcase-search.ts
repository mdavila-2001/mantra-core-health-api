/**
 * Applies {@link searchDocs} to the public showcase: one document per
 * medication concept — every vademécum medication, plus the brands any
 * pharmacy publishes it under.
 *
 * The vademécum is searched too so a search never comes back empty just
 * because no pharmacy publishes that medication yet: «dolor abdominal» still
 * shows butylscopolamine, as a card that says no pharmacy has it.
 */
import type { PublicMedicationCardDto } from '../dto';
import type { PublishedOffer, VademecumConcept } from '../repositories';
import { groupOf } from './atc-groups';
import {
  searchDocs,
  usesOf,
  type SearchDoc,
  type SearchOutcome,
} from './medication-matcher';
import { normalize } from './search-text';

/** Result of a showcase search. */
export interface ShowcaseSearch {
  /** Offers whose medication matched (all of them without a query). */
  offers: PublishedOffer[];
  /** Matched vademécum medications that no pharmacy publishes. */
  catalogOnly: VademecumConcept[];
  outcome: SearchOutcome;
}

/** The offers and vademécum medications that match the query, and why. */
export function searchShowcase(
  offers: readonly PublishedOffer[],
  vademecum: readonly VademecumConcept[],
  query: string | undefined,
  exact: boolean,
): ShowcaseSearch {
  const byConcept = new Map<string, SearchDoc>();
  for (const concept of vademecum) {
    byConcept.set(concept.conceptId, {
      key: concept.conceptId,
      names: [concept.genericName],
      brands: [],
      codes: [concept.atcCode],
      atc: concept.atcCode,
    });
  }
  for (const offer of offers) {
    const known = byConcept.get(offer.conceptId);
    byConcept.set(offer.conceptId, {
      key: offer.conceptId,
      names: [...(known?.names ?? []), offer.genericName],
      brands: [...(known?.brands ?? []), offer.brandName],
      codes: [offer.atcCode],
      atc: offer.atcCode,
    });
  }
  const outcome = searchDocs([...byConcept.values()], query, exact);
  const { matches } = outcome;
  if (matches === null)
    return { offers: [...offers], catalogOnly: [], outcome };
  const matchedOffers = offers.filter((offer) => matches.has(offer.conceptId));
  // One card per medication name: the vademécum has some substances under two
  // ATC codes (ibuprofen M01AE01 and C01EB16). The first one wins, and
  // `findVademecum` lists the most-prescribed (most LINAME presentations) first.
  const shown = new Set(
    matchedOffers.map((offer) => normalize(offer.genericName)),
  );
  const catalogOnly: VademecumConcept[] = [];
  for (const concept of vademecum) {
    const name = normalize(concept.genericName);
    if (!matches.has(concept.conceptId) || shown.has(name)) continue;
    shown.add(name);
    catalogOnly.push(concept);
  }
  return { offers: matchedOffers, catalogOnly, outcome };
}

/** A card for a vademécum medication that no pharmacy publishes. */
export function catalogOnlyCard(
  concept: VademecumConcept,
): PublicMedicationCardDto {
  return {
    conceptId: concept.conceptId,
    atcCode: concept.atcCode,
    genericName: concept.genericName,
    therapeuticGroup: groupOf(concept.atcCode),
    uses: usesOf(concept.atcCode),
    brands: [],
    presentations: [],
    requiresPrescription: false,
    priceFrom: null,
    priceTo: null,
    currency: null,
    pharmacyCount: 0,
    nearestKm: null,
  };
}

/**
 * Adds why each card matched, and orders: better match first, then cards a
 * pharmacy publishes before catalog-only ones (stable inside each tier).
 */
export function decorateCards(
  cards: readonly PublicMedicationCardDto[],
  outcome: SearchOutcome,
): PublicMedicationCardDto[] {
  const decorated = cards.map((card) => {
    const match = outcome.matches?.get(card.conceptId);
    return {
      ...card,
      matchedBy: match?.matchedBy ?? null,
      matchedUse: match?.matchedUse ?? null,
    };
  });
  const score = (card: PublicMedicationCardDto) =>
    outcome.matches?.get(card.conceptId)?.score ?? 0;
  const published = (card: PublicMedicationCardDto) =>
    card.pharmacyCount > 0 ? 1 : 0;
  return decorated.sort(
    (a, b) => score(b) - score(a) || published(b) - published(a),
  );
}
