import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useLocation, useMatches, useNavigate } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';

import { Icon } from '../components/icons/Icon';
import type { WebModule } from '../modules/registry';
import type { RouteHandle, ShellMode } from '../modules/registry';
import { findModule, moduleRegistry } from '../modules/registry';
import { useAuth } from './auth';
import { ModuleLauncher } from './ModuleLauncher';
import { useModuleEntryCounts } from './useModuleEntryCounts';
import { useUserModules } from './userModules';

import styles from './AppShell.module.css';

/** モジュール色をこのサブツリーへ流し込むためのインラインカスタムプロパティ。 */
function toneStyle(moduleKey: ModuleKey): CSSProperties {
  return {
    '--tone-bg': `var(--color-${moduleKey}-bg)`,
    '--tone-line': `var(--color-${moduleKey}-line)`,
    '--tone-fg': `var(--color-${moduleKey}-fg)`,
    '--tone-solid': `var(--color-${moduleKey}-solid)`,
  } as CSSProperties;
}

export interface AppShellProps {
  children: ReactNode;
}

/**
 * 全 PC 画面で共通のシェル。ルートの handle.shellMode で
 * 幅広サイドバー(カレンダー・家計簿)とアイコンレール(左に自前のリストを持つ画面)を切り替える。
 * SP(< 768px)ではハンバーガー＋ドロワーに収納する。
 */
export function AppShell({ children }: AppShellProps) {
  const matches = useMatches();
  const location = useLocation();
  const { addedKeys } = useUserModules();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  // もっとも深いルートが宣言した shellMode を採用する(既定は幅広サイドバー)
  const shellMode: ShellMode = matches.reduce<ShellMode>((mode, match) => {
    const handle = match.handle as RouteHandle | undefined;
    return handle?.shellMode ?? mode;
  }, 'sidebar');

  const addedModules = addedKeys
    .map((key) => findModule(key))
    .filter((module): module is WebModule => module !== undefined);

  // ルートパス('/')は他のすべてに前方一致するため、より長い basePath を優先する
  const activeModule = addedModules.reduce<WebModule | undefined>((current, module) => {
    if (module.basePath === '/' || !location.pathname.startsWith(module.basePath)) return current;
    if (current && current.basePath.length >= module.basePath.length) return current;
    return module;
  }, undefined);
  const activeKey: ModuleKey = activeModule?.definition.key ?? 'calendar';

  const openLauncher = () => {
    setIsLauncherOpen(true);
    setIsDrawerOpen(false);
  };

  return (
    <div className={styles.root}>
      {shellMode === 'sidebar' ? (
        <Sidebar modules={addedModules} activeKey={activeKey} onOpenLauncher={openLauncher} />
      ) : (
        <Rail modules={addedModules} activeKey={activeKey} onOpenLauncher={openLauncher} />
      )}

      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.hamburger}
            aria-label="メニューを開く"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>
          <span className={styles.mobileTitle}>
            {findModule(activeKey)?.definition.displayName ?? 'recodock'}
          </span>
        </header>
        {children}
      </div>

      {isDrawerOpen ? (
        <MobileDrawer
          modules={addedModules}
          activeKey={activeKey}
          onClose={() => setIsDrawerOpen(false)}
          onOpenLauncher={openLauncher}
        />
      ) : null}

      <ModuleLauncher isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
    </div>
  );
}

interface NavProps {
  modules: readonly WebModule[];
  activeKey: ModuleKey;
  onOpenLauncher: () => void;
}

/** 幅広サイドバー(SC-04 / MON-20)。検索の横に Google 風のランチャーを置く。 */
function Sidebar({ modules, activeKey, onOpenLauncher }: NavProps) {
  const navigate = useNavigate();
  const entryCounts = useModuleEntryCounts();
  const activeModule = modules.find((module) => module.definition.key === activeKey);
  const activeSecondaryNav = activeModule?.secondaryNav
    ? {
        label: `${activeModule.definition.brandName.replace('Reco ', '').toUpperCase()} 内ナビ`,
        items: activeModule.secondaryNav,
        moduleKey: activeModule.definition.key,
      }
    : undefined;

  return (
    <nav
      className={styles.sidebar}
      aria-label="モジュール"
      style={activeSecondaryNav ? toneStyle(activeSecondaryNav.moduleKey) : undefined}
    >
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <Icon name="logo" size={22} />
        </span>
        <span className={styles.brandName}>recodock</span>
      </div>

      <div className={styles.searchRow}>
        <button type="button" className={styles.searchBox} onClick={() => navigate('/search')}>
          <Icon name="search" size={16} />
          すべての記録を検索
        </button>
        <button
          type="button"
          className={styles.launcher}
          aria-label="モジュールランチャーを開く"
          onClick={onOpenLauncher}
        >
          <Icon name="grid" size={18} />
        </button>
      </div>

      <p className={styles.sectionLabel}>マイモジュール</p>
      <div className={styles.navList}>
        {modules.map((module) => (
          <ModuleNavLink
            key={module.definition.key}
            module={module}
            activeKey={activeKey}
            count={entryCounts.get(module.definition.key)}
          />
        ))}
        <button type="button" className={styles.addModule} onClick={onOpenLauncher}>
          <Icon name="plus" size={18} />
          モジュールを追加
        </button>
      </div>

      {activeSecondaryNav ? (
        <div className={styles.secondaryNav}>
          <p className={styles.secondaryNavLabel}>{activeSecondaryNav.label}</p>
          <div className={styles.secondaryNavList}>
            {activeSecondaryNav.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  [styles.secondaryNavItem, isActive ? styles.secondaryNavItemActive : '']
                    .filter(Boolean)
                    .join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.sidebarFooter}>
        <NavLink to="/modules" className={styles.footerItem}>
          <Icon name="grid" size={19} />
          モジュール管理
        </NavLink>
        <NavLink to="/settings" className={styles.footerItem}>
          <Icon name="settings" size={19} />
          設定
        </NavLink>
        <UserRow />
      </div>
    </nav>
  );
}

interface ModuleNavLinkProps {
  module: WebModule;
  activeKey: ModuleKey;
  /** サイドバー右端に出す記録件数 */
  count?: number;
}

/** サイドバー最下段のユーザー行。押すとログアウトする。 */
function UserRow() {
  const { user, signOut } = useAuth();
  const label = user?.displayName ?? user?.email ?? 'ゲスト';
  return (
    <button type="button" className={styles.user} onClick={() => void signOut()} title="ログアウト">
      <span className={styles.avatar} />
      <span className={styles.userName}>{label}</span>
      <span className={styles.signOut}>ログアウト</span>
    </button>
  );
}

function ModuleNavLink({ module, activeKey, count }: ModuleNavLinkProps) {
  const isActive = module.definition.key === activeKey;
  return (
    <NavLink
      to={module.basePath}
      style={toneStyle(module.definition.key)}
      className={[styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')}
    >
      <span className={styles.navIcon}>
        <Icon name={module.icon} size={20} />
      </span>
      {module.definition.displayName}
      {count !== undefined ? <span className={styles.navCount}>{count}</span> : null}
    </NavLink>
  );
}

/** アイコンレール(DIA-40 / SC-07 / SC-05 / ITM-50 / MEM-60)。左に自前のリストを持つ画面で使う。 */
function Rail({ modules, activeKey, onOpenLauncher }: NavProps) {
  return (
    <nav className={styles.rail} aria-label="モジュール">
      <NavLink to="/" className={styles.railBrand} aria-label="ホーム">
        <Icon name="logo" size={23} />
      </NavLink>

      {modules.map((module) => {
        const isActive = module.definition.key === activeKey;
        return (
          <NavLink
            key={module.definition.key}
            to={module.basePath}
            style={toneStyle(module.definition.key)}
            aria-label={module.definition.displayName}
            className={[styles.railItem, isActive ? styles.railItemActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            <Icon name={module.icon} size={22} />
          </NavLink>
        );
      })}

      <button
        type="button"
        className={styles.railAdd}
        aria-label="モジュールを追加"
        onClick={onOpenLauncher}
      >
        <Icon name="plus" size={20} />
      </button>

      <div className={styles.railFooter}>
        <NavLink
          to="/search"
          aria-label="横断検索"
          className={({ isActive }) =>
            [styles.railFooterItem, isActive ? styles.railFooterItemActive : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          <Icon name="search" size={20} />
        </NavLink>
        <NavLink
          to="/modules"
          aria-label="モジュール管理"
          className={({ isActive }) =>
            [styles.railFooterItem, isActive ? styles.railFooterItemActive : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          <Icon name="grid" size={20} />
        </NavLink>
        <NavLink
          to="/settings"
          aria-label="設定"
          className={({ isActive }) =>
            [styles.railFooterItem, isActive ? styles.railFooterItemActive : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          <Icon name="settings" size={20} />
        </NavLink>
      </div>
    </nav>
  );
}

interface MobileDrawerProps extends NavProps {
  onClose: () => void;
}

/** SP のモジュール切替ドロワー。追加できるモジュールも同じ場所から辿れる。 */
function MobileDrawer({ modules, activeKey, onClose, onOpenLauncher }: MobileDrawerProps) {
  const navigate = useNavigate();
  const addedKeys = new Set(modules.map((module) => module.definition.key));
  const addableModules = moduleRegistry.filter((module) => !addedKeys.has(module.definition.key));

  return (
    <>
      <div className={styles.drawerScrim} onClick={onClose} role="presentation" />
      <nav className={styles.drawer} aria-label="モジュール">
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Icon name="logo" size={22} />
          </span>
          <span className={styles.brandName}>recodock</span>
        </div>

        <div className={styles.searchRow}>
          <button
            type="button"
            className={styles.searchBox}
            onClick={() => {
              onClose();
              navigate('/search');
            }}
          >
            <Icon name="search" size={17} />
            検索
          </button>
        </div>

        <p className={styles.sectionLabel}>マイモジュール</p>
        <div className={styles.navList} onClick={onClose} role="presentation">
          {modules.map((module) => (
            <ModuleNavLink key={module.definition.key} module={module} activeKey={activeKey} />
          ))}
        </div>

        {addableModules.length > 0 ? (
          <div className={styles.drawerAddable}>
            <p className={styles.drawerAddableLabel}>追加できるモジュール</p>
            <div className={styles.drawerAddableRow}>
              {addableModules.map((module) => (
                <button
                  key={module.definition.key}
                  type="button"
                  className={styles.drawerAddableItem}
                  style={toneStyle(module.definition.key)}
                  onClick={onOpenLauncher}
                >
                  <span className={styles.drawerAddableIcon}>
                    <Icon name={module.icon} size={24} />
                  </span>
                  <span className={styles.drawerAddableName}>{module.definition.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.sidebarFooter} onClick={onClose} role="presentation">
          <NavLink to="/modules" className={styles.footerItem}>
            <Icon name="grid" size={20} />
            モジュール管理
          </NavLink>
          <NavLink to="/settings" className={styles.footerItem}>
            <Icon name="settings" size={20} />
            設定
          </NavLink>
        </div>
      </nav>
    </>
  );
}
