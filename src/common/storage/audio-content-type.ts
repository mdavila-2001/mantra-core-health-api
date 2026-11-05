/**
 * Byte-signature recognition for the audio formats browsers record.
 *
 * The chat voice note is recorded with `MediaRecorder`, whose container
 * depends on the browser: WebM (Chrome, Edge, Firefox), Ogg (Firefox) or
 * MP4/M4A (Safari). MP3 and WAV cover audio files picked from disk.
 * Kept apart from the image/document signatures so that audio only enters
 * through the upload of a chat attachment, never as a credential or a chart
 * document.
 */

/** Audio MIME types this layer recognises by signature. */
export type AudioMimeType =
  'audio/webm' | 'audio/ogg' | 'audio/mp4' | 'audio/mpeg' | 'audio/wav';

export const AUDIO_MIME_TYPES: readonly AudioMimeType[] = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
];

/** ISO BMFF `major_brand` values used by MP4/M4A audio (not HEIC/AVIF). */
const MP4_AUDIO_BRANDS = new Set([
  'M4A ',
  'M4B ',
  'mp41',
  'mp42',
  'isom',
  'iso2',
  'iso5',
  'iso6',
  'dash',
]);

const ascii = (buffer: Buffer, start: number, end: number): string =>
  buffer.subarray(start, end).toString('latin1');

/**
 * MPEG audio frame sync: 11 set bits and a non-reserved layer. ADTS/AAC
 * (layer `00`) is excluded so it is not mislabelled as MP3.
 */
const isMpegFrame = (buffer: Buffer): boolean =>
  buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0 && (buffer[1] & 0x06) !== 0;

/**
 * Deduces the audio type from the first bytes of the content.
 *
 * @param buffer - Received content.
 * @returns The recognised audio type, or `undefined`.
 */
export function sniffAudioMimeType(buffer: Buffer): AudioMimeType | undefined {
  if (buffer.byteLength < 4) return undefined;
  // EBML header; the `webm` DocType sits within the first bytes.
  if (buffer.readUInt32BE(0) === 0x1a45dfa3) {
    return ascii(buffer, 0, 64).includes('webm') ? 'audio/webm' : undefined;
  }
  if (ascii(buffer, 0, 4) === 'OggS') return 'audio/ogg';
  if (ascii(buffer, 0, 3) === 'ID3' || isMpegFrame(buffer)) return 'audio/mpeg';
  if (buffer.byteLength < 12) return undefined;
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WAVE') {
    return 'audio/wav';
  }
  if (
    ascii(buffer, 4, 8) === 'ftyp' &&
    MP4_AUDIO_BRANDS.has(ascii(buffer, 8, 12))
  ) {
    return 'audio/mp4';
  }
  return undefined;
}
