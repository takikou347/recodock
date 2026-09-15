import type { LucideIcon } from 'lucide-react';
import { PlusIcon } from 'lucide-react';

import type { ModuleKey } from '@recodock/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FabAction {
  moduleKey: ModuleKey;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
}

export interface FabProps {
  /** 押すと開くモジュール選択メニュー */
  actions: readonly FabAction[];
}

/**
 * 記録追加の FAB。押すとモジュール選択メニューを開く。
 * 配置は親側の `relative` を基準にする。
 */
export function Fab({ actions }: FabProps) {
  return (
    <div className="absolute right-4 bottom-4 z-20 sm:right-6 sm:bottom-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-lg" className="size-12 rounded-full shadow-lg" aria-label="記録を追加">
            <PlusIcon className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-44">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <DropdownMenuItem key={action.moduleKey} onSelect={action.onSelect}>
                <ActionIcon />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
