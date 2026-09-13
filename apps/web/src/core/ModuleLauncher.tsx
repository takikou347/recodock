import { CheckIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';

import { useUserModules } from './userModules';

import { useToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { moduleRegistry } from '@/modules/registry';

export interface ModuleLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SC-08 モジュールランチャー。サイドバーの「モジュールを追加」から開く。
 * 使うモジュールだけを自分で追加する。追加した順にサイドバー／iOS タブへ並ぶ。
 */
export function ModuleLauncher({ isOpen, onClose }: ModuleLauncherProps) {
  const navigate = useNavigate();
  const { addedKeys, addModule } = useUserModules();
  const { showToast } = useToast();

  const onSelect = (
    moduleKey: ModuleKey,
    displayName: string,
    isAdded: boolean,
    basePath: string,
  ) => {
    if (isAdded) {
      onClose();
      navigate(basePath);
      return;
    }
    addModule(moduleKey);
    showToast({ message: `${displayName}を追加しました` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>モジュール</DialogTitle>
          <DialogDescription>使うものだけ追加できます</DialogDescription>
        </DialogHeader>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {moduleRegistry.map((module) => {
            const moduleKey = module.definition.key;
            const isAdded = addedKeys.includes(moduleKey);
            const ModuleIcon = module.icon;
            return (
              <li key={moduleKey}>
                <button
                  type="button"
                  className={cn(
                    'hover:bg-accent focus-visible:ring-ring/50 flex h-full w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
                    isAdded && 'bg-muted/40',
                  )}
                  onClick={() =>
                    onSelect(moduleKey, module.definition.displayName, isAdded, module.basePath)
                  }
                >
                  <ModuleIcon className="text-muted-foreground size-5" />
                  <span className="text-sm font-medium">{module.definition.displayName}</span>
                  <span className="text-muted-foreground text-xs">{module.description}</span>
                  <Badge variant={isAdded ? 'secondary' : 'outline'} className="mt-auto">
                    {isAdded ? <CheckIcon /> : <PlusIcon />}
                    {isAdded ? '追加済み' : '追加'}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            追加した順にサイドバー／iOS タブへ並びます
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/modules" onClick={onClose}>
              モジュール管理を開く
              <ChevronRightIcon />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
