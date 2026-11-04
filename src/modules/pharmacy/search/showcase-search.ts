/**
 * Applies {@link searchDocs} to the public showcase: one document per
 * medication concept, with every brand any pharmacy publishes it under.
 */
import type { PublicMedicationCardDto } from '../dto';
import type { PublishedOffer } from '../repositories';
import {
  searchDocs,
  type SearchDoc,
  type SearchOutcome,
} from './medication-matcher';

/** The offers whose medication matches the query, and why. */
export function searchOffers(
  offers: readonly PublishedOffer[],
  query: string | undefined,
  exact: boolean,
): { offers: PublishedOffer[]; outcome: SearchOutcome } {
  const byConcept = new Map<string, SearchDoc>();
  for (const offer of offers) {
    const known = byConcept.get(offer.conceptId);
    byConcept.set(offer.conceptId, {
      key: offer.conceptId,
      names: [offer.genericName],
      brands: [...(known?.brands ?? []), offer.brandName],
      codes: [offer.atcCode],
      atc: offer.atcCode,
    });
  }
  const outcome = searchDocs([...byConcept.values()], query, exact);
  const { matches } = outcome;
  return {
    offers:
      matches === null
        ? [...offers]
        : offers.filter((offer) => matches.has(offer.conceptId)),
    outcome,
  };
}

/**
 * Adds why each card matched, and puts name matches
 * before use matches (stable: the service's order holds inside each tier).
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
  return decorated.sort((a, b) => score(b) - score(a));
}
