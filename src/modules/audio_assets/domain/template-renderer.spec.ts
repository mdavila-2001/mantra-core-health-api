import { renderAudioTemplate } from './template-renderer';

describe('renderAudioTemplate', () => {
  it('renderiza sólo placeholders declarados y normalizados', () => {
    const result = renderAudioTemplate({
      textTemplate: 'Hola {preferredName}.',
      fields: [{ name: 'preferredName', type: 'PERSON_NAME', required: true }],
      variables: { preferredName: ' PABLO ' },
    });
    expect(result.renderedText).toBe('Hola Pablo.');
    expect(result.normalizedValues).toEqual({ preferredName: 'pablo' });
  });

  it('falla si la plantilla contiene un placeholder no declarado', () => {
    expect(() => renderAudioTemplate({ textTemplate: 'Hola {secret}.', fields: [], variables: {} }))
      .toThrow('Placeholder no declarado');
  });
});
