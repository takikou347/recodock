import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPinIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { SpotRecord, SpotStatus } from '@recodock/shared';
import { AppError, spotsRepo } from '@recodock/shared';

import { Button } from '@/components/Button';
import { DatePicker } from '@/components/DatePicker';
import { Modal } from '@/components/Modal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/core/auth';
import { toDateKey } from '@/lib/monthRange';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = [
  { value: 'visited', label: '訪問済み' },
  { value: 'wishlist', label: '行きたい' },
] as const satisfies readonly { value: SpotStatus; label: string }[];

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
  const [latitudeText, setLatitudeText] = useState('');
  const [longitudeText, setLongitudeText] = useState('');
  const [memo, setMemo] = useState('');
  const [errorText, setErrorText] = useState<string>();
  const loadedId = useRef<string | undefined>(undefined);
  const visitedOnLabelId = useId();

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
    setLatitudeText(spot ? String(spot.latitude) : '');
    setLongitudeText(spot ? String(spot.longitude) : '');
    setMemo(spot?.memo ?? '');
    setErrorText(undefined);
  }, [isOpen, spot]);

  const onSave = async () => {
    if (!name.trim()) {
      setErrorText('場所名を入力してください');
      return;
    }
    // 空のまま保存すると、本人が置いていない座標が「自分の記録」として残る。
    // 地図タイル上での指定を入れるまでは数値入力を必須にする
    const latitude = Number(latitudeText.trim());
    const longitude = Number(longitudeText.trim());
    if (latitudeText.trim() === '' || !Number.isFinite(latitude) || Math.abs(latitude) > 90) {
      setErrorText('緯度は -90〜90 の数で入力してください');
      return;
    }
    if (longitudeText.trim() === '' || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
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
        errorText={errorText}
        onChange={(event) => setName(event.target.value)}
      />

      <SegmentedControl
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
        ariaLabel="スポットの状態"
      />

      {status === 'visited' ? (
        // DatePicker は id を受け取らないので、ラベルは group に aria-labelledby で結びつける(監査 H-12)
        <div className="grid gap-2" role="group" aria-labelledby={visitedOnLabelId}>
          <Label id={visitedOnLabelId}>訪問日</Label>
          <DatePicker value={visitedOn} onChange={setVisitedOn} ariaLabel="訪問日" />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="緯度"
          type="number"
          inputMode="decimal"
          isNumeric
          value={latitudeText}
          onChange={(event) => setLatitudeText(event.target.value)}
        />
        <TextField
          label="経度"
          type="number"
          inputMode="decimal"
          isNumeric
          value={longitudeText}
          onChange={(event) => setLongitudeText(event.target.value)}
        />
      </div>

      <TextField label="メモ" value={memo} onChange={(event) => setMemo(event.target.value)} />
    </Modal>
  );
}
