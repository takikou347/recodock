import { SearchIcon, XIcon } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'value' | 'onChange'
> {
  value: string;
  onValueChange: (value: string) => void;
  /** 視覚ラベルが無いので必須 */
  ariaLabel: string;
}

/**
 * 検索入力。4 画面でばらばらに実装されていたものを 1 つにまとめた(監査 H-17)。
 * `type="search"` にすると OS 既定の×が出て見た目が割れるため、消去は自前のボタンで出す。
 */
export function SearchField({
  value,
  onValueChange,
  ariaLabel,
  className,
  placeholder = '検索',
  ...rest
}: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <SearchIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="px-8"
        {...rest}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="検索語を消す"
          className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => onValueChange('')}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
