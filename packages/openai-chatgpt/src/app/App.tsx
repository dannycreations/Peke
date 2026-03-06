import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { modelIdSignal, systemPromptSignal } from '../stores/useStore';
import { getStoredItem, setStoredItem } from '../utilities/storage';
import { CONFIG } from './constants';

import type { ComponentChildren, ErrorInfo } from 'preact';

class ErrorBoundary extends Component<{ children: ComponentChildren }, { hasError: boolean }> {
  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public constructor(props: { children: ComponentChildren }) {
    super(props);
    this.state = { hasError: false };
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('OpenAI ChatGPT Tweak Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const AppContent = () => {
  const modelId = modelIdSignal.value;
  const systemPrompt = systemPromptSignal.value;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: Math.round(rect.bottom), left: Math.round(rect.right) });
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen || isTooltipVisible) {
      updateCoords();

      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);

      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isMenuOpen, isTooltipVisible, updateCoords]);

  const loadPrompt = useCallback(() => {
    try {
      const prompts = getStoredItem<Record<string, string>>(CONFIG.PROMPT_STORAGE_KEY, {});
      const currentPath = window.location.pathname;

      if (currentPath.startsWith('/c/') && prompts['/'] && !prompts[currentPath]) {
        prompts[currentPath] = prompts['/'];
        delete prompts['/'];
        setStoredItem(CONFIG.PROMPT_STORAGE_KEY, prompts);
      }

      const historyElement = document.querySelector('#history') || document.querySelector('nav');
      if (historyElement) {
        const hrefElements = historyElement.querySelectorAll('a[href^="/c/"]');
        const historyHrefs = Array.from(hrefElements).map((r) => r.getAttribute('href'));
        const histories = new Set(historyHrefs.filter(Boolean));

        histories.add(currentPath);

        let changed = false;
        for (const url of Object.keys(prompts)) {
          if (url.startsWith('/c/') && !histories.has(url)) {
            delete prompts[url];
            changed = true;
          }
        }
        if (changed) {
          setStoredItem(CONFIG.PROMPT_STORAGE_KEY, prompts);
        }
      }

      const prompt = prompts[currentPath] || prompts['/'] || '';
      systemPromptSignal.value = prompt;
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  }, []);

  const savePrompt = (value: string) => {
    const trimmed = value.trim();
    const currentPath = window.location.pathname;
    const prompts = getStoredItem<Record<string, string>>(CONFIG.PROMPT_STORAGE_KEY, {});

    let changesMade = false;
    if (trimmed) {
      if (prompts[currentPath] !== trimmed) {
        prompts[currentPath] = trimmed;
        changesMade = true;
      }
    } else {
      if (Object.prototype.hasOwnProperty.call(prompts, currentPath)) {
        delete prompts[currentPath];
        changesMade = true;
      }
    }

    if (changesMade) {
      setStoredItem(CONFIG.PROMPT_STORAGE_KEY, prompts);
      systemPromptSignal.value = trimmed;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1000);
    }
  };

  useEffect(() => {
    loadPrompt();

    const handleUrlChange = () => loadPrompt();
    window.addEventListener('popstate', handleUrlChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleUrlChange();
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleUrlChange();
      return result;
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);

      // Avoid double restore if unmounted multiple times
      if (window.history.pushState === originalPushState) return;

      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [loadPrompt]);

  useEffect(() => {
    if (isMenuOpen) {
      loadPrompt();
    }
  }, [isMenuOpen, loadPrompt]);

  useEffect(() => {
    setStoredItem(CONFIG.MODEL_STORAGE_KEY, modelIdSignal.value);
  }, [modelId]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const menu = document.querySelector('[role="menu"]');
        if (menu && !menu.contains(e.target as Node)) {
          setIsMenuOpen(false);
          buttonRef.current.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id={CONFIG.MODEL_STORAGE_KEY}
        type="button"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        className="hover:bg-token-bg-tertiary group-radix-state-open:bg-token-bg-tertiary rounded-full p-2.5"
        onClick={() => setIsMenuOpen((prev: boolean) => !prev)}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="21" y1="4" x2="14" y2="4" />
          <line x1="10" y1="4" x2="3" y2="4" />
          <line x1="21" y1="12" x2="12" y2="12" />
          <line x1="8" y1="12" x2="3" y2="12" />
          <line x1="21" y1="20" x2="16" y2="20" />
          <line x1="12" y1="20" x2="3" y2="20" />
          <line x1="14" y1="2" x2="14" y2="6" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <line x1="16" y1="18" x2="16" y2="22" />
        </svg>
      </button>

      {isTooltipVisible &&
        !isMenuOpen &&
        createPortal(
          <div
            className="fixed z-[1000]"
            style={{
              top: 0,
              left: 0,
              transform: `translate(${coords.left}px, ${coords.top + 8}px) translateX(-100%)`,
            }}
          >
            <div className="relative z-50 transition-opacity select-none px-2 py-1 rounded-lg overflow-hidden bg-black max-w-xs">
              <div className="text-xs font-semibold whitespace-pre-wrap normal-case text-center text-white">
                Selected: {(CONFIG.AVAILABLE_MODELS as Record<string, string>)[modelId] || modelId}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isMenuOpen &&
        createPortal(
          <div
            role="menu"
            className="fixed z-[1000]"
            style={{
              top: 0,
              left: 0,
              transform: `translate(${coords.left}px, ${coords.top + 4}px) translateX(-100%)`,
            }}
          >
            <div className="w-80 rounded-2xl popover dark:bg-[#353535] shadow-long overflow-y-auto select-none outline-none">
              <div className="flex group __menu-item px-4 text-token-text-tertiary bg-transparent cursor-default justify-between items-center">
                <div className="cursor-text">Select Model</div>
              </div>
              <div className="bg-token-border-default h-px mx-4 my-1 cursor-default" />
              <div className="px-2 py-1">
                <select
                  id="model-select"
                  className="w-full text-sm rounded-lg border border-token-border-medium bg-token-main-surface-secondary p-2 focus:outline-none focus:ring-1 focus:ring-token-main-surface-tertiary"
                  value={modelId}
                  onChange={(e) => (modelIdSignal.value = (e.target as HTMLSelectElement).value)}
                >
                  {Object.entries(CONFIG.AVAILABLE_MODELS).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex group __menu-item px-4 text-token-text-tertiary bg-transparent cursor-default justify-between items-center">
                <div className="cursor-text">System Prompt</div>
                <button
                  type="button"
                  title="Save Prompt"
                  className="p-1 -mr-2 rounded-md hover:bg-token-main-surface-tertiary"
                  onClick={() => savePrompt(systemPrompt)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill={isSaved ? 'green' : 'currentColor'} className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.208Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="bg-token-border-default h-px mx-4 my-1 cursor-default" />
              <div className="px-2 py-1">
                <textarea
                  rows={6}
                  placeholder="Enter custom system prompt..."
                  className="w-full text-sm rounded-lg border border-token-border-medium bg-token-main-surface-secondary p-2 resize-none focus:outline-none focus:ring-1 focus:ring-token-main-surface-tertiary"
                  value={systemPrompt}
                  onBlur={(e) => savePrompt((e.target as HTMLTextAreaElement).value)}
                  onChange={(e) => (systemPromptSignal.value = (e.target as HTMLTextAreaElement).value)}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export const AppView = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);
