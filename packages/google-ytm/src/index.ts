import { runOnComplete, runOnObserver } from '@/helpers/autorun';
import { debounce } from 'es-toolkit';

interface PlaylistState {
  readonly length: number;
  readonly firstElement: string | null;
}

interface SongData {
  readonly element: Element;
  readonly plays: number;
}

let lastSortedLength: number = 0;
let lastFirstElement: string | null = null;

const MULTIPLIERS: Record<string, number> = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
} as const;

function parsePlayCount(playString: string | null): number {
  if (!playString) {
    return 0;
  }

  const text = playString.trim().toUpperCase();
  const num = parseFloat(text);

  if (Number.isNaN(num)) {
    return 0;
  }

  for (const unit in MULTIPLIERS) {
    if (text.includes(unit)) {
      return num * MULTIPLIERS[unit];
    }
  }

  return num;
}

function getPlaylistState(container: Element): PlaylistState {
  const items = container.querySelectorAll<Element>('ytmusic-responsive-list-item-renderer');
  const length = items.length;
  let firstElement: string | null = null;

  if (length > 0) {
    const firstItem = items[0];
    const link = firstItem.querySelector<HTMLAnchorElement>('a[href]');

    if (link?.href) {
      firstElement = link.href;
    }
  }

  return { length, firstElement };
}

function sortPlaylist(): void {
  const container = document.querySelector('ytmusic-playlist-shelf-renderer #contents');
  if (!container) return;

  const continuationItem = container.querySelector('ytmusic-continuation-item-renderer');
  const songItems = container.querySelectorAll('ytmusic-responsive-list-item-renderer');

  if (songItems.length < 2) return;

  const songData: SongData[] = [];
  let isSorted = true;

  for (let i = 0; i < songItems.length; i++) {
    const element = songItems[i];
    const playCountElement = element.querySelector<HTMLElement>('yt-formatted-string[title*=" plays"]');
    const plays = playCountElement ? parsePlayCount(playCountElement.title) : 0;

    songData.push({ element, plays });

    if (isSorted && i > 0 && songData[i - 1].plays < plays) {
      isSorted = false;
    }
  }

  if (isSorted) {
    return;
  }

  songData.sort((a, b) => b.plays - a.plays);

  const fragment = document.createDocumentFragment();
  for (const { element } of songData) {
    fragment.appendChild(element);
  }

  if (continuationItem) {
    fragment.appendChild(continuationItem);
  }

  container.replaceChildren(fragment);

  const currentState = getPlaylistState(container);
  lastSortedLength = currentState.length;
  lastFirstElement = currentState.firstElement;
}

function main(): void {
  sortPlaylist();

  const debouncedSortPlaylist = debounce(sortPlaylist, 100);
  const target = document.querySelector('ytmusic-app-layout') || document.body;

  runOnObserver(
    (mutations) => {
      const hasMeaningfulChange = mutations.some(
        (m) =>
          m.addedNodes.length > 0 &&
          Array.prototype.some.call(
            m.addedNodes,
            (n) =>
              n instanceof HTMLElement &&
              (n.matches('ytmusic-responsive-list-item-renderer') || n.querySelector('ytmusic-responsive-list-item-renderer')),
          ),
      );

      if (!hasMeaningfulChange) {
        return;
      }

      const playlistContainer = document.querySelector('ytmusic-playlist-shelf-renderer #contents');
      if (!playlistContainer) {
        return;
      }

      const currentState = getPlaylistState(playlistContainer);
      if (currentState.length !== lastSortedLength || currentState.firstElement !== lastFirstElement) {
        debouncedSortPlaylist();
      }
    },
    { target },
  );
}

runOnComplete(main);
