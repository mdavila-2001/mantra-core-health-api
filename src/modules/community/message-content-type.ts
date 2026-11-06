import { defineModuleConcepts } from '../../common/seed/concept-seed';
import { COMM } from './community.concepts';

/**
 * Content type of a direct message, as the client sends and reads it.
 *
 * `STICKER` is a sticker the person uploaded (an image): the other side draws
 * it without a bubble. Pack stickers keep travelling as `MEDIA`, recognised by
 * their fixed file id. Kept out of `community.concepts.ts`, frozen by the
 * max-lines ratchet; same `community` prefix, so its id is derived the same way.
 */
export const { seeds: MESSAGE_CONTENT_CONCEPT_SEEDS, ids: MESSAGE_CONTENT } =
  defineModuleConcepts('community', {
    MESSAGE_CONTENT_STICKER: {
      code: 'MESSAGE_CONTENT_STICKER',
      display: 'Sticker message',
    },
  });

export const MESSAGE_CONTENT_TYPES = ['TEXT', 'MEDIA', 'STICKER'] as const;
export type MessageContentType = (typeof MESSAGE_CONTENT_TYPES)[number];

const CONCEPT_BY_TYPE: Record<MessageContentType, string> = {
  TEXT: COMM.MESSAGE_CONTENT_TEXT,
  MEDIA: COMM.MESSAGE_CONTENT_MEDIA,
  STICKER: MESSAGE_CONTENT.MESSAGE_CONTENT_STICKER,
};

/** Concept id to persist; no type means plain text. */
export const messageContentConceptId = (type?: MessageContentType): string =>
  CONCEPT_BY_TYPE[type ?? 'TEXT'];

/** Type to publish for a stored concept id; unknown ids publish nothing. */
export const messageContentTypeOf = (
  conceptId?: string | null,
): MessageContentType | undefined =>
  MESSAGE_CONTENT_TYPES.find((type) => CONCEPT_BY_TYPE[type] === conceptId);
