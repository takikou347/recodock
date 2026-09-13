import {
  ChevronsUpDownIcon,
  LayoutGridIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';

import { useAuth } from './auth';
import { ModuleLauncher } from './ModuleLauncher';
import { useModuleEntryCounts } from './useModuleEntryCounts';
import { useUserModules } from './userModules';

import { BrandMark } from '@/components/icons/BrandMark';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { WebModule } from '@/modules/registry';
import { findModule } from '@/modules/registry';

export interface AppShellProps {
  children: ReactNode;
}

/**
 * 全画面共通のシェル(01_screen_design.md 3.2)。
 * サイドバーは 1 種類だけで、幅(通常 / アイコンのみ)は利用者が切り替える(⌘B・端のレール・フッターのボタン)。
 * SP(< 768px)では shadcn/ui の Sidebar がシート(フォーカストラップ・ESC・aria-modal つき)に切り替える。
 * ログアウト・検索・モジュール管理・設定は、幅や端末にかかわらず常に同じ場所から辿れる。
 */
export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { addedKeys } = useUserModules();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

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

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          modules={addedModules}
          activeKey={activeKey}
          onOpenLauncher={() => setIsLauncherOpen(true)}
        />
        <SidebarInset>
          <MobileHeader title={findModule(activeKey)?.definition.displayName ?? 'recodock'} />
          {children}
        </SidebarInset>
        <ModuleLauncher isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
      </SidebarProvider>
    </TooltipProvider>
  );
}

/** SP 専用のヘッダー。PC では描画しない(DOM にも残さない)。 */
function MobileHeader({ title }: { title: string }) {
  const { isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <header className="bg-background sticky top-0 z-10 flex h-12 items-center gap-2 border-b px-3">
      <SidebarTrigger aria-label="メニューを開く" />
      <span className="text-sm font-medium">{title}</span>
    </header>
  );
}

interface AppSidebarProps {
  modules: readonly WebModule[];
  activeKey: ModuleKey;
  onOpenLauncher: () => void;
}

function AppSidebar({ modules, activeKey, onOpenLauncher }: AppSidebarProps) {
  const entryCounts = useModuleEntryCounts();
  const { isMobile, setOpenMobile } = useSidebar();

  // SP のシートは遷移しても自動では閉じないため、リンクを押したら閉じる
  const closeOnNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="recodock">
              <Link to="/" onClick={closeOnNavigate}>
                <BrandMark />
                <span className="font-heading text-base font-semibold">recodock</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="すべての記録を検索">
                  <NavLink to="/search" onClick={closeOnNavigate}>
                    <SearchIcon />
                    <span>すべての記録を検索</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <nav aria-label="モジュール">
          <SidebarGroup>
            <SidebarGroupLabel>マイモジュール</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {modules.map((module) => {
                  const ModuleIcon = module.icon;
                  const isActive = module.definition.key === activeKey;
                  const count = entryCounts.get(module.definition.key);
                  const secondaryNav = isActive ? module.secondaryNav : undefined;
                  return (
                    <SidebarMenuItem key={module.definition.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={module.definition.displayName}
                      >
                        <NavLink to={module.basePath} onClick={closeOnNavigate}>
                          <ModuleIcon />
                          <span>{module.definition.displayName}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      {count !== undefined ? <SidebarMenuBadge>{count}</SidebarMenuBadge> : null}
                      {secondaryNav ? (
                        <SidebarMenuSub>
                          {secondaryNav.map((item) => (
                            <SidebarMenuSubItem key={item.path}>
                              <NavLink to={item.path} end onClick={closeOnNavigate}>
                                {({ isActive: isSubActive }) => (
                                  <SidebarMenuSubButton asChild isActive={isSubActive}>
                                    <span>{item.label}</span>
                                  </SidebarMenuSubButton>
                                )}
                              </NavLink>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="モジュールを追加"
                    className="text-muted-foreground"
                    onClick={onOpenLauncher}
                  >
                    <PlusIcon />
                    <span>モジュールを追加</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/modules" onClick={closeOnNavigate}>
              {({ isActive }) => (
                <SidebarMenuButton asChild isActive={isActive} tooltip="モジュール管理">
                  <span>
                    <LayoutGridIcon />
                    <span>モジュール管理</span>
                  </span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NavLink to="/settings" onClick={closeOnNavigate}>
              {({ isActive }) => (
                <SidebarMenuButton asChild isActive={isActive} tooltip="設定">
                  <span>
                    <SettingsIcon />
                    <span>設定</span>
                  </span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
          <CollapseToggle />
          <UserMenu />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** サイドバー幅の切り替え。SP はシートなので出さない。 */
function CollapseToggle() {
  const { isMobile, state, toggleSidebar } = useSidebar();
  if (isMobile) return null;
  const isCollapsed = state === 'collapsed';
  const label = isCollapsed ? 'サイドバーを広げる' : 'サイドバーを畳む';
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        className="text-muted-foreground"
        aria-label={label}
        onClick={toggleSidebar}
      >
        {isCollapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** 最下段のユーザーメニュー。ログアウトはここからだけ行う(誤操作防止のため 1 段挟む)。 */
function UserMenu() {
  const { user, signOut } = useAuth();
  const { isMobile } = useSidebar();
  const label = user?.displayName ?? user?.email ?? 'ゲスト';
  const initial = label.trim().charAt(0).toUpperCase() || '?';

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* tooltip を付けると Tooltip でラップされて返り、Trigger のイベントがボタンに届かないので付けない */}
          <SidebarMenuButton size="lg" aria-label={label}>
            <Avatar className="size-8 rounded-md">
              <AvatarFallback className="rounded-md text-xs">{initial}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{label}</span>
            <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? 'top' : 'right'}
          align="end"
          className="w-56"
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-muted-foreground truncate text-xs font-normal">
            {user?.email ?? label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOutIcon />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
