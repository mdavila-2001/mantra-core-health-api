import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SendMessageDto } from './conversation.dto';
import {
  messageContentConceptId,
  messageContentTypeOf,
} from '../message-content-type';

const SENDER = '6f3a22aa-1111-4111-8111-111111111111';
const FILE = '6f3a22aa-1111-4111-8111-111111111112';

const errors = (body: Record<string, unknown>) =>
  validateSync(
    plainToInstance(SendMessageDto, { senderProfileId: SENDER, ...body }),
  ).map((e) => e.property);

describe('SendMessageDto', () => {
  it('un adjunto sin leyenda (`bodyText: ""`) es válido', () => {
    expect(errors({ bodyText: '', attachmentFileId: FILE })).toEqual([]);
    expect(errors({ bodyText: '  ', attachmentFileId: FILE })).toEqual([]);
  });

  it('el texto vacío se normaliza a «sin texto»', () => {
    const dto = plainToInstance(SendMessageDto, {
      senderProfileId: SENDER,
      bodyText: '',
      attachmentFileId: FILE,
    });
    expect(dto.bodyText).toBeUndefined();
  });

  it('sin texto ni adjunto no hay mensaje', () => {
    expect(errors({})).toContain('bodyText');
    expect(errors({ bodyText: '' })).toContain('bodyText');
  });

  it('STICKER exige adjunto', () => {
    expect(errors({ contentType: 'STICKER' })).toContain('attachmentFileId');
    expect(errors({ contentType: 'STICKER', attachmentFileId: FILE })).toEqual(
      [],
    );
  });

  it('un tipo desconocido se rechaza', () => {
    expect(errors({ contentType: 'AUDIO', attachmentFileId: FILE })).toContain(
      'contentType',
    );
  });
});

describe('tipo de contenido del mensaje', () => {
  it('ida y vuelta entre tipo y concepto', () => {
    for (const type of ['TEXT', 'MEDIA', 'STICKER'] as const) {
      expect(messageContentTypeOf(messageContentConceptId(type))).toBe(type);
    }
    expect(messageContentConceptId()).toBe(messageContentConceptId('TEXT'));
    expect(messageContentTypeOf('otro')).toBeUndefined();
  });
});
