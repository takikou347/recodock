import { useEffect, useRef, useState } from 'react';

import type { ItemRecord } from '@recodock/shared';
import { AppError } from '@recodock/shared';

import { Button } from '../../components/Button';
import { DatePicker } from '../../components/DatePicker';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { toDateKey } from '../../lib/monthRange';
import { useSaveItem } from './useItems';

import styles from './ItemEditModal.module.css';

export interface ItemEditModalProps {
  isOpen: boolean;
  /** 渡すと編集モード(ITM-52 は作成・編集を兼ねる) */
  item?: ItemRecord;
  onClose: () => void;
}

/** ITM-52 持ち物作成・編集。名称・カテゴリ・購入日・価格・保管場所・保証期限(ITM-01, ITM-03)。 */
export function ItemEditModal({ isOpen, item, onClose }: ItemEditModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const saveItem = useSaveItem(user?.id);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchasedOn, setPurchasedOn] = useState<Date>();
  const [priceText, setPriceText] = useState('');
  const [location, setLocation] = useState('');
  const [warrantyExpiresOn, setWarrantyExpiresOn] = useState<Date>();
  const [memo, setMemo] = useState('');
  const [errorText, setErrorText] = useState<string>();
  const loadedId = useRef<string | undefined>(undefined);

  // 編集対象が来たらフォームへ読み込む(開き直すたびに一度だけ)
  useEffect(() => {
    if (!isOpen) {
      loadedId.current = undefined;
      return;
    }
    const key = item?.id ?? 'new';
    if (loadedId.current === key) return;
    loadedId.current = key;
    setName(item?.name ?? '');
    setCategory(item?.category ?? '');
    setPurchasedOn(item?.purchasedOn ? new Date(`${item.purchasedOn}T00:00:00`) : undefined);
    setPriceText(item?.price !== null && item?.price !== undefined ? String(item.price) : '');
    setLocation(item?.location ?? '');
    setWarrantyExpiresOn(
      item?.warrantyExpiresOn ? new Date(`${item.warrantyExpiresOn}T00:00:00`) : undefined,
    );
    setMemo(item?.memo ?? '');
    setErrorText(undefined);
  }, [isOpen, item]);

  const onSave = async () => {
    if (!name.trim()) {
      setErrorText('名称を入力してください');
      return;
    }
    const price = priceText ? Number(priceText) : null;
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setErrorText('価格は 0 以上の数で入力してください');
      return;
    }
    setErrorText(undefined);
    try {
      await saveItem.mutateAsync({
        itemId: item?.id,
        input: {
          name: name.trim(),
          category: category.trim() || null,
          purchasedOn: purchasedOn ? toDateKey(purchasedOn) : null,
          price,
          location: location.trim() || null,
          warrantyExpiresOn: warrantyExpiresOn ? toDateKey(warrantyExpiresOn) : null,
          memo: memo.trim() || null,
        },
      });
      showToast({ message: '持ち物を保存しました' });
      onClose();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? '持ち物を編集' : '持ち物を追加'}
      icon="items"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => void onSave()} disabled={saveItem.isPending}>
            {saveItem.isPending ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <TextField
        label="名称"
        value={name}
        placeholder="加湿器"
        errorText={errorText}
        onChange={(event) => setName(event.target.value)}
      />
      <div className={styles.pairRow}>
        <div className={styles.field}>
          <TextField
            label="カテゴリ"
            value={category}
            placeholder="家電"
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <TextField
            label="価格"
            type="number"
            inputMode="numeric"
            isNumeric
            value={priceText}
            placeholder="12000"
            onChange={(event) => setPriceText(event.target.value)}
          />
        </div>
      </div>
      <div className={styles.pairRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>購入日</span>
          <DatePicker
            value={purchasedOn ?? new Date()}
            onChange={setPurchasedOn}
            ariaLabel="購入日"
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>保証期限</span>
          <DatePicker
            value={warrantyExpiresOn ?? new Date()}
            onChange={setWarrantyExpiresOn}
            ariaLabel="保証期限"
          />
        </div>
      </div>
      <TextField
        label="保管場所"
        value={location}
        placeholder="押入れ"
        onChange={(event) => setLocation(event.target.value)}
      />
      <TextField label="備考" value={memo} onChange={(event) => setMemo(event.target.value)} />
    </Modal>
  );
}
