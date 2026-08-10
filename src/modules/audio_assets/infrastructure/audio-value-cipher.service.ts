import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { loadAudioEnv } from '../audio.env';

const VERSION = 'v1';

/** Cifra el texto renderizado para que PII validada nunca quede en claro en PostgreSQL. */
@Injectable()
export class AudioValueCipherService {
  private readonly key = createHash('sha256').update(loadAudioEnv().dataKey, 'utf8').digest();

  encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
  }

  decrypt(payload: string): string {
    const [version, ivPart, tagPart, dataPart] = payload.split('.');
    if (version !== VERSION || !ivPart || !tagPart || !dataPart) {
      throw new Error('Payload cifrado de audio inválido');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
