import { Injectable } from '@nestjs/common';
import {
  coordinatesFromMapLink,
  type MapCoordinates,
} from '../domain/map-link-coordinates';
import type { MapLinkResolverPort } from '../domain/ports/map-link-resolver.port';

/** Hosts that only redirect: the one thing the server is allowed to fetch. */
const SHORT_LINK_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);
const MAX_HOPS = 4;
const TIMEOUT_MS = 3000;

/**
 * Resolves map links: reads the coordinates from the text when it has them
 * and, for Google's short links, follows the redirect chain.
 *
 * ## Why it cannot be used to reach other servers
 *
 * The server only requests a URL whose host is in {@link SHORT_LINK_HOSTS}
 * over https, one hop at a time with `redirect: 'manual'`. A `Location` that
 * leaves those hosts is parsed as text and never requested, so the caller
 * cannot point it at an internal address.
 */
@Injectable()
export class HttpMapLinkResolver implements MapLinkResolverPort {
  async resolve(link: string): Promise<MapCoordinates | undefined> {
    let current = link;
    for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
      const found = coordinatesFromMapLink(current);
      if (found) return found;
      const next = await this.nextHop(current);
      if (!next) return undefined;
      current = next;
    }
    return undefined;
  }

  /** The `Location` of a short link, or `undefined` if there is none to follow. */
  private async nextHop(link: string): Promise<string | undefined> {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      return undefined;
    }
    if (url.protocol !== 'https:' || !SHORT_LINK_HOSTS.has(url.hostname)) {
      return undefined;
    }
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const location = response.headers.get('location');
      return location ? new URL(location, url).toString() : undefined;
    } catch {
      return undefined;
    }
  }
}
