import type { MapCoordinates } from '../map-link-coordinates';

/** Injection token for {@link MapLinkResolverPort}. */
export const MAP_LINK_RESOLVER_PORT = Symbol('MAP_LINK_RESOLVER_PORT');

/** Turns a map link, short or long, into the point it points to. */
export interface MapLinkResolverPort {
  /**
   * @param link - What the user pasted (`https://…`).
   * @returns The coordinates, or `undefined` when they cannot be found.
   *   Never throws: an unresolvable link is not an error of the caller.
   */
  resolve(link: string): Promise<MapCoordinates | undefined>;
}
