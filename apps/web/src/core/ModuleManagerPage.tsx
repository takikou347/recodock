import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from 'lucide-react';

import { CORE_MODULE_KEY, useUserModules } from './userModules';

import { useToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/core/PageLayout';
import type { WebModule } from '@/modules/registry';
import { findModule, moduleRegistry } from '@/modules/registry';

/** iOS のタブに載るのは上位4件。残りは「その他」に入る(01_screen_design.md 3.3)。 */
const IOS_TAB_SLOT_COUNT = 4;

/**
 * SC-05 モジュール管理。
 * 追加済みモジュールの並び順が Web サイドバーと iOS タブ(上位4件＋その他)に即反映される。
 * 並べ替えはドラッグではなく上下ボタンで行う。キーボードだけで操作でき、読み上げにも乗るため。
 */
export function ModuleManagerPage() {
  const { addedKeys, addModule, removeModule, reorderModule } = useUserModules();
  const { showToast } = useToast();

  const addedModules = addedKeys
    .map((key) => findModule(key))
    .filter((module): module is WebModule => module !== undefined);
  const addableModules = moduleRegistry.filter(
    (module) => !addedKeys.includes(module.definition.key),
  );

  const onAdd = (module: WebModule) => {
    addModule(module.definition.key);
    showToast({ message: `${module.definition.displayName}を追加しました` });
  };

  const onRemove = (module: WebModule) => {
    removeModule(module.definition.key);
    showToast({
      message: `${module.definition.displayName}を削除しました`,
      onUndo: () => addModule(module.definition.key),
    });
  };

  return (
    <Page className="max-w-3xl">
      <PageHeader
        title="モジュール管理"
        description="追加したモジュールだけが並びます。並び順は Web サイドバーと iOS タブ(上位 4 件＋その他)に即反映されます。"
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-xs font-medium">
          追加済み {addedModules.length} 件
        </h2>
        <ul className="flex flex-col gap-2">
          {addedModules.map((module, index) => {
            const ModuleIcon = module.icon;
            const isCore = module.definition.key === CORE_MODULE_KEY;
            return (
              <li
                key={module.definition.key}
                className="bg-card flex items-center gap-3 rounded-xl border p-3"
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${module.definition.displayName}を上へ`}
                    disabled={index === 0}
                    onClick={() => reorderModule(module.definition.key, index - 1)}
                  >
                    <ChevronUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${module.definition.displayName}を下へ`}
                    disabled={index === addedModules.length - 1}
                    onClick={() => reorderModule(module.definition.key, index + 1)}
                  >
                    <ChevronDownIcon />
                  </Button>
                </div>
                <ModuleIcon className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {module.definition.brandName} ／ {module.definition.displayName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{module.detail}</p>
                </div>
                {index < IOS_TAB_SLOT_COUNT ? (
                  <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                    iOS タブ {index + 1}
                  </Badge>
                ) : null}
                {isCore ? (
                  <Badge variant="secondary" className="shrink-0">
                    コア
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${module.definition.displayName}を削除`}
                    onClick={() => onRemove(module)}
                  >
                    削除
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {addableModules.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-medium">追加できるモジュール</h2>
          <ul className="flex flex-col gap-2">
            {addableModules.map((module) => {
              const ModuleIcon = module.icon;
              return (
                <li
                  key={module.definition.key}
                  className="flex items-center gap-3 rounded-xl border border-dashed p-3"
                >
                  <ModuleIcon
                    className="text-muted-foreground size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{module.definition.displayName}</p>
                    <p className="text-muted-foreground truncate text-xs">{module.detail}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`${module.definition.displayName}を追加`}
                    onClick={() => onAdd(module)}
                  >
                    <PlusIcon />
                    追加
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </Page>
  );
}
