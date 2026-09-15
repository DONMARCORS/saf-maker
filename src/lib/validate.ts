import type { Item } from '../types';
import { pendingRefs } from './files';

export interface ItemReport {
  key: number;
  errors: string[];
  warnings: string[];
}

export function validateItems(items: Item[]): ItemReport[] {
  return items.map((item) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const pending = pendingRefs(item);
    if (pending.length > 0) {
      errors.push(
        `Faltan ${pending.length} archivo(s) referenciado(s): ${pending.map((p) => p.name).join(', ')}`,
      );
    }
    if (item.files.length === 0 && pending.length === 0) {
      errors.push('El item no tiene archivos');
    }
    if (item.metadata.length === 0) {
      warnings.push('No tiene metadatos');
    } else if (!item.metadata.some((m) => m.schema === 'dc' && m.element === 'title')) {
      warnings.push('No tiene dc.title (recomendado)');
    }

    for (const f of item.files) {
      if (f.name.startsWith('.')) {
        warnings.push(`El archivo "${f.name}" empieza por "."`);
      }
      // eslint-disable-next-line no-control-regex
      if (/[:\u0000-\u001f]/.test(f.name)) {
        warnings.push(`El nombre "${f.name}" contiene caracteres que pueden dar problemas`);
      }
    }

    if (item.collections.length > 1) {
      warnings.push('Se especifican varias colecciones; la primera será la propietaria');
    }

    return { key: item.key, errors, warnings };
  });
}

export interface AggregateReport {
  total: number;
  errorCount: number;
  warningCount: number;
  itemsWithErrors: number;
  itemsWithWarnings: number;
}

export function aggregate(reports: ItemReport[]): AggregateReport {
  let errorCount = 0;
  let warningCount = 0;
  let itemsWithErrors = 0;
  let itemsWithWarnings = 0;
  for (const r of reports) {
    if (r.errors.length) itemsWithErrors += 1;
    if (r.warnings.length) itemsWithWarnings += 1;
    errorCount += r.errors.length;
    warningCount += r.warnings.length;
  }
  return {
    total: reports.length,
    errorCount,
    warningCount,
    itemsWithErrors,
    itemsWithWarnings,
  };
}