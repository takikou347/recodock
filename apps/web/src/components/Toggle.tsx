import { useId } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface ToggleProps {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  /** トグル右のラベル。視覚ラベルが無い場合は ariaLabel を渡す */
  label?: string;
  ariaLabel?: string;
  isDisabled?: boolean;
}

/** ON/OFF のスイッチ。実体は Radix の Switch。 */
export function Toggle({ isOn, onChange, label, ariaLabel, isDisabled = false }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={isOn}
        onCheckedChange={onChange}
        disabled={isDisabled}
        aria-label={label ? undefined : ariaLabel}
      />
      {label ? (
        <Label htmlFor={id} className="text-sm font-normal">
          {label}
        </Label>
      ) : null}
    </div>
  );
}
