import {
  OWN_TOPICS_CODE,
  TOPIC_CATEGORIES,
  topicCode,
  topicId,
} from './community-topics.catalog';

describe('community topic catalog', () => {
  const codes = TOPIC_CATEGORIES.flatMap((c) => [
    c.code,
    ...c.topics.map(topicCode),
  ]);

  it('has unique codes and ids', () => {
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(codes.map(topicId)).size).toBe(codes.length);
  });

  it('derives stable codes without accents', () => {
    expect(topicCode('Cirugía general')).toBe('CIRUGIA_GENERAL');
    expect(topicId('CIRUGIA_GENERAL')).toBe(topicId('CIRUGIA_GENERAL'));
  });

  it('ships the own-topics parent and several categories', () => {
    expect(codes).toContain(OWN_TOPICS_CODE);
    expect(TOPIC_CATEGORIES.length).toBeGreaterThanOrEqual(9);
  });
});
