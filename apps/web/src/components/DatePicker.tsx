import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

import { formatDateValue, WEEKDAYS } from '@recodock/shared';

import { buildMonthGrid, isSameDay, shiftMonth } from '../lib/calendarGrid';
import { weekdayColorVar } from '../lib/format';
import { Icon } from './icons/Icon';

import styles from './DatePicker.module.css';

export interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  ariaLabel: string;
}

/** 日付ピッカー(1e)。入力欄をクリックすると月グリッドのパネルを開く。 */
export function DatePicker({ value, onChange, ariaLabel }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const cells = buildMonthGrid(visibleMonth, value);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={[styles.trigger, isOpen ? styles.open : ''].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {formatDateValue(value)}
        <span className={styles.triggerIcon}>
          <Icon name="calendar" size={17} />
        </span>
      </button>

      {isOpen ? (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelMonth}>
              {visibleMonth.getFullYear()}年 {visibleMonth.getMonth() + 1}月
            </span>
            <div className={styles.panelNav}>
              <button
                type="button"
                className={styles.navButton}
                aria-label="前の月"
                onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
              >
                <Icon name="chevronLeft" size={12} />
              </button>
              <button
                type="button"
                className={styles.navButton}
                aria-label="次の月"
                onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
              >
                <Icon name="chevronRight" size={12} />
              </button>
            </div>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((label, index) => {
              const style: CSSProperties = {
                '--day-color': weekdayColorVar(index),
              } as CSSProperties;
              return (
                <span key={label} className={styles.weekday} style={style}>
                  {label}
                </span>
              );
            })}
          </div>

          <div className={styles.grid}>
            {cells.map((cell) => {
              const isSelected = isSameDay(cell.date, value);
              return (
                <span key={cell.date.toISOString()} className={styles.dayCell}>
                  <button
                    type="button"
                    className={[
                      styles.day,
                      cell.isOutside ? styles.outside : '',
                      isSelected ? styles.selected : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={isSelected}
                    onClick={() => {
                      onChange(cell.date);
                      setIsOpen(false);
                    }}
                  >
                    {cell.date.getDate()}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
