import type { Item } from '../types';
import type { ItemReport } from '../lib/validate';
import ItemCard from './ItemCard';

export type ItemReportMap = Map<number, ItemReport>;

interface Props {
  items: Item[];
  reports: ItemReportMap;
  unmatched: File[];
  prefix: string;
  digits: number;
  onAddFiles: (key: number, files: File[], bundle: string) => void;
  onRemoveFile: (key: number, fileId: string) => void;
}

export default function ItemList({
  items,
  reports,
  unmatched,
  prefix,
  digits,
  onAddFiles,
  onRemoveFile,
}: Props) {
  return (
    <section className="panel">
      <h2>Items ({items.length})</h2>
      <p className="muted">Haz clic en un item para expandirlo y gestionar sus archivos.</p>
      <div className="items">
        {items.map((item, i) => (
          <ItemCard
            key={item.key}
            item={item}
            index={i}
            prefix={prefix}
            digits={digits}
            report={reports.get(item.key) ?? { key: item.key, errors: [], warnings: [] }}
            unmatched={unmatched}
            onAddFiles={onAddFiles}
            onRemoveFile={onRemoveFile}
          />
        ))}
      </div>
    </section>
  );
}