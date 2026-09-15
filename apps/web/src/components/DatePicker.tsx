import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

import { formatDateValue, WEEKDAYS } from '@recodock/shared';

import { buildMonthGrid, isSameDay, shiftMonth } from '../lib/calendarGrid';
import { weekdayTextClass } from '../lib/format';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  ariaLabel: string;
  /** `<Label htmlFor>` と結びつけるための id(監査 H-12) */
  id?: string;
  className?: string;
}

/** 日付ピッカー。実体は Radix の Popover なので ESC・外側クリック・フォーカス復帰が付く。 */
export function DatePicker({ value, onChange, ariaLabel, id, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const cells = buildMonthGrid(visibleMonth, value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          aria-label={ariaLabel}
          className={cn('justify-between font-normal', className)}
        >
          {formatDateValue(value)}
          <CalendarDaysIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {visibleMonth.getFullYear()}年 {visibleMonth.getMonth() + 1}月
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="前の月"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="次の月"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((label, index) => (
            <span
              key={label}
              className={cn('py-1 text-center text-xs', weekdayTextClass(index))}
              aria-hidden="true"
            >
              {label}
            </span>
          ))}
          {cells.map((cell) => {
            const isSelected = isSameDay(cell.date, value);
            return (
              <button
                key={cell.date.toISOString()}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  'focus-visible:ring-ring/50 size-8 rounded-md text-sm tabular-nums focus-visible:ring-[3px] focus-visible:outline-none',
                  cell.isOutside && 'text-muted-foreground/50',
                  isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
                onClick={() => {
                  onChange(cell.date);
                  setIsOpen(false);
                }}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
