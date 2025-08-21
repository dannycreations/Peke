import { setAutorun } from '@/helpers/autorun';

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

const parsePlayCount = (playString: string | null): number => {
  if (!playString) {
    return 0;
  }

  const text = playString.trim().toUpperCase();
  const num = parseFloat(text);

  if (isNaN(num)) {
    return 0;
  }

  let multiplier = 1;
  if (text.includes('K')) {
    multiplier = 1_000;
  } else if (text.includes('M')) {
    multiplier = 1_000_000;
  } else if (text.includes('B')) {
    multiplier = 1_000_000_000;
  }

  return num * multiplier;
};

const getPlaylistState = (container: Element): PlaylistState => {
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
};

const sortPlaylistByPlays = (): void => {
  const container = document.querySelector('ytmusic-playlist-shelf-renderer #contents');
  if (!container) {
    return;
  }

  const continuationItem = container.querySelector('ytmusic-continuation-item-renderer');
  if (continuationItem) {
    continuationItem.remove();
  }

  const songItem = container.querySelectorAll('ytmusic-responsive-list-item-renderer');
  const songData: SongData[] = Array.from(songItem).map((item) => {
    const playCountElement = item.querySelector<HTMLElement>('yt-formatted-string[title*=" plays"]');
    const plays = playCountElement ? parsePlayCount(playCountElement.title) : 0;

    return { element: item, plays };
  });

  const reAppendContinuationItem = () => {
    if (continuationItem) {
      container.appendChild(continuationItem);
    }
  };

  if (songData.length < 2) {
    reAppendContinuationItem();
    return;
  }

  songData.sort((a, b) => b.plays - a.plays);

  const fragment = document.createDocumentFragment();
  songData.forEach((data) => {
    fragment.appendChild(data.element);
  });

  container.textContent = '';
  container.appendChild(fragment);

  reAppendContinuationItem();

  const currentState = getPlaylistState(container);
  lastSortedLength = currentState.length;
  lastFirstElement = currentState.firstElement;
};

function main(): void {
  sortPlaylistByPlays();

  const observer = new MutationObserver(() => {
    const playlistContainer = document.querySelector('ytmusic-playlist-shelf-renderer #contents');

    if (playlistContainer) {
      const currentState = getPlaylistState(playlistContainer);

      const hasLengthChanged = currentState.length !== lastSortedLength;
      const hasFirstElementChanged = currentState.firstElement !== lastFirstElement;

      if (hasLengthChanged || hasFirstElementChanged) {
        console.log('Playlist changed, re-sorting...');
        sortPlaylistByPlays();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

setAutorun('complete', main);
