import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateBy, ValidateIf } from 'class-validator';

const PICTOGRAPHIC = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;
const CONTROL = /\p{Cc}/u;

/**
 * Whether a value is exactly one emoji: one grapheme cluster (so 👍🏽, ❤️ and
 * 👨‍⚕️ count as one) that is pictographic, a flag or a keycap. A reaction is
 * not a side channel for text.
 */
export function isSingleEmoji(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > 32 || CONTROL.test(value))
    return false;
  const graphemes = [
    ...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
      value,
    ),
  ];
  return graphemes.length === 1 && PICTOGRAPHIC.test(value);
}

/** Body of `PUT /community/conversations/:id/messages/:messageId/reaction`. */
export class ReactToMessageDto {
  /** Reacting profile (active participant; must belong to the actor). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  profileId!: string;

  /**
   * One emoji, or `null` to remove the profile's reaction; another emoji
   * replaces it (one reaction per profile and message, like WhatsApp). It is
   * required: an omitted `emoji` is a 400, never a silent removal.
   */
  @ApiProperty({ type: String, nullable: true, maxLength: 32 })
  @ValidateIf((_, value) => value !== null)
  @ValidateBy({
    name: 'isSingleEmoji',
    validator: {
      validate: isSingleEmoji,
      defaultMessage: () => 'emoji debe ser un único emoji o null',
    },
  })
  emoji!: string | null;
}

/** One emoji on a message and who reacted with it. */
export class MessageReactionDto {
  /** The emoji. */
  @ApiProperty()
  emoji!: string;

  /** Profiles that reacted with this emoji, oldest first. */
  @ApiProperty({ type: String, isArray: true, format: 'uuid' })
  profileIds!: string[];
}
