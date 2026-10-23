import { create } from 'zustand';

export type PluginsTab = 'installed' | 'store';

type SettingsModalState = {
  isOpen: boolean;
  activeItemId: string | null;
  isShowingContent: boolean;
  pluginsTab: PluginsTab;
  open: (itemId?: string) => void;
  openPluginStore: () => void;
  close: () => void;
  selectItem: (itemId: string) => void;
  showNavigation: () => void;
  selectPluginsTab: (tab: PluginsTab) => void;
};

export const useSettingsModalStore = create<SettingsModalState>((set) => ({
  isOpen: false,
  activeItemId: null,
  isShowingContent: false,
  pluginsTab: 'installed',
  open: (itemId) =>
    set((state) => ({
      isOpen: true,
      activeItemId: itemId ?? state.activeItemId,
      isShowingContent: Boolean(itemId),
    })),
  openPluginStore: () =>
    set({
      isOpen: true,
      activeItemId: 'app-plugins',
      isShowingContent: true,
      pluginsTab: 'store',
    }),
  close: () => set({ isOpen: false }),
  selectItem: (itemId) => set({ activeItemId: itemId, isShowingContent: true }),
  showNavigation: () => set({ isShowingContent: false }),
  selectPluginsTab: (pluginsTab) => set({ pluginsTab }),
}));
