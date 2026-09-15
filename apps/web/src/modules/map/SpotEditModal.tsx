import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPinIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { SpotRecord, SpotStatus } from '@recodock/shared';
import { AppError, spotsRepo } from '@recodock/shared';

import { Button } from '../../components/Button';
import { DatePicker } from '../../components/DatePicker';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { toDateKey } from '../../lib/monthRange';
import { supabase } from '../../lib/supabase';

import styles from './SpotEditModal.module.css';

export interface SpotEditModalProps {
  isOpen: boolean;
  /** 渡すと編集モード(MAP-72 は作成・編集を兼ねる) */
  spot?: SpotRecord;
  onClose: () => void;
}

/**
 * MAP-72 スポット作成・編集。座標・訪問済み/行きたい(MAP-04)・訪問日・メモ。
 * 座標は地図タイル導入までは数値入力(緯度・経度)で指定する。
 */
export function SpotEditModal({ isOpen, spot, onClose }: SpotEditModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<SpotStatus>('visited');
  const [visitedOn, setVisitedOn] = useState<Date>(() => new Date());
  const [latitudeText, setLatitudeText] = useState('35.0092');
  const [longitudeText, setLongitudeText] = useState('135.7727');
  const [memo, setMemo] = useState('');
  const [errorText, setErrorText] = useState<string>();
  const loadedId = useRef<string | undefined>(undefined);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('ログインが必要です');
      const input = {
        name: name.trim(),
        latitude: Number(latitudeText),
        longitude: Number(longitudeText),
        status,
        // 訪問日は「訪問済み」のときのみ持つ(02_data_model.md 3.7。制約はアプリ層)
        visitedOn: status === 'visited' ? toDateKey(visitedOn) : null,
        memo: memo.trim() || null,
      };
      if (spot) await spotsRepo.update(supabase, spot.id, input);
      else await spotsRepo.create(supabase, user.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['map'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });

  // 編集対象が来たらフォームへ読み込む(開き直すたびに一度だけ)
  useEffect(() => {
    if (!isOpen) {
      loadedId.current = undefined;
      return;
    }
    const key = spot?.id ?? 'new';
    if (loadedId.current === key) return;
    loadedId.current = key;
    setName(spot?.name ?? '');
    setStatus(spot?.status ?? 'visited');
    setVisitedOn(spot?.visitedOn ? new Date(`${spot.visitedOn}T00:00:00`) : new Date());
    setLatitudeText(spot ? String(spot.latitude) : '35.0092');
    setLongitudeText(spot ? String(spot.longitude) : '135.7727');
    setMemo(spot?.memo ?? '');
    setErrorText(undefined);
  }, [isOpen, spot]);

  const onSave = async () => {
    if (!name.trim()) {
      setErrorText('場所名を入力してください');
      return;
    }
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setErrorText('緯度は -90〜90 の数で入力してください');
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setErrorText('経度は -180〜180 の数で入力してください');
      return;
    }
    setErrorText(undefined);
    try {
      await saveMutation.mutateAsync();
      showToast({ message: 'スポットを保存しました' });
      onClose();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={spot ? 'スポットを編集' : 'スポットを追加'}
      icon={MapPinIcon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => void onSave()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <TextField
        label="場所名"
        value={name}
        placeholder="鴨川 三条"
        errorText={errorText}
        onChange={(event) => setName(event.target.value)}
      />

      <div className={styles.statusSwitch} role="radiogroup" aria-label="スポットの状態">
        <button
          type="button"
          role="radio"
          aria-checked={status === 'visited'}
          className={[styles.statusOption, status === 'visited' ? styles.statusSelected : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => setStatus('visited')}
        >
          訪問済み
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={status === 'wishlist'}
          className={[styles.statusOption, status === 'wishlist' ? styles.statusSelected : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => setStatus('wishlist')}
        >
          行きたい
        </button>
      </div>

      {status === 'visited' ? (
        <div>
          <span className={styles.fieldLabel}>訪問日</span>
          <DatePicker value={visitedOn} onChange={setVisitedOn} ariaLabel="訪問日" />
        </div>
      ) : null}

      <div className={styles.pairRow}>
        <div className={styles.field}>
          <TextField
            label="緯度"
            type="number"
            inputMode="decimal"
            isNumeric
            value={latitudeText}
            onChange={(event) => setLatitudeText(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <TextField
            label="経度"
            type="number"
            inputMode="decimal"
            isNumeric
            value={longitudeText}
            onChange={(event) => setLongitudeText(event.target.value)}
          />
        </div>
      </div>

      <TextField label="メモ" value={memo} onChange={(event) => setMemo(event.target.value)} />
    </Modal>
  );
}
