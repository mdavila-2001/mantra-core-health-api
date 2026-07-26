import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PublicProjectionsController } from './public-projections.controller';

function build() {
  const service = { searchDirectory: mockFn(), getBySlug: mockFn() };
  const controller = new PublicProjectionsController(service as any);
  return { controller, service };
}

describe('PublicProjectionsController (UC-30-10)', () => {
  it('delegates searchDirectory', async () => {
    const d = build();
    await d.controller.searchDirectory('Lima', 'cardiology');
    expect(d.service.searchDirectory).toHaveBeenCalledWith({ city: 'Lima', specialty: 'cardiology' });
  });

  it('delegates getBySlug', async () => {
    const d = build();
    d.service.getBySlug.mockResolvedValue({ slug: 'x' });
    await expect(d.controller.getBySlug('x')).resolves.toEqual({ slug: 'x' });
    expect(d.service.getBySlug).toHaveBeenCalledWith('x');
  });
});
