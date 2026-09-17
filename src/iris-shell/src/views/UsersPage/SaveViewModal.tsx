import { useEffect, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/Button/Button.js';
import { Modal } from '../../components/Modal/Modal.js';
import { TextInput } from '../../components/TextInput/TextInput.js';
import { Checkbox } from '../../components/Checkbox/Checkbox.js';
import styles from './SaveViewModal.module.css';

export interface SaveViewModalProps {
  open: boolean;
  onClose: () => void;
  /** Number of active filters — shown as a badge and used to decide whether
   *  the "include filters" checkbox is offered at all. */
  filterCount: number;
  /** `includeFilters` is false when the user unchecks the filter option —
   *  the view still saves search/sort/table state, just not the filters. */
  onSave: (name: string, includeFilters: boolean) => void;
}

/**
 * SaveViewModal — "Add to Favorites" (Figma node 4154:4792). Names the
 * current page state so it can be pinned as a "view" in the sidebar's
 * Favourites panel (e.g. "Users in My OU"), with an option to leave active
 * filters out of the saved view.
 */
export function SaveViewModal({ open, onClose, filterCount, onSave }: SaveViewModalProps) {
  const [name, setName] = useState('');
  const [includeFilters, setIncludeFilters] = useState(true);

  // Reset each time the modal re-opens.
  useEffect(() => {
    if (open) {
      setName('');
      setIncludeFilters(true);
    }
  }, [open]);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(name.trim(), includeFilters);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Favorites"
      size="s"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            Add
          </Button>
        </>
      }
    >
      <div className={styles.field}>
        <span className={styles.fieldLabelRow}>
          <strong>Name</strong>
          <span>(Required)</span>
        </span>
        <TextInput
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="e.g. Users in My OU"
          autoFocus
        />
        <p className={styles.helperText}>
          Favorites preserve the current sorting, search, and table customizations. If a favorite with the same
          name already exists, it will be updated.
        </p>
      </div>
      {filterCount > 0 && (
        <div className={styles.filterRow}>
          <label className={styles.filterCheckboxLabel}>
            <Checkbox checked={includeFilters} onChange={setIncludeFilters} ariaLabel="Save active filters with this view" />
            Save active filters with this view
          </label>
          <span className={styles.filterBadge}>{filterCount}</span>
        </div>
      )}
    </Modal>
  );
}
