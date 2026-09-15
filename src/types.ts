export interface Settings {
  prefix: string;
  digits: number;
  multiSep: string;
  autoThumbs: boolean;
  thumbMax: number;
}

export const defaultSettings: Settings = {
  prefix: 'item_',
  digits: 3,
  multiSep: '||',
  autoThumbs: true,
  thumbMax: 360,
};

export interface MetadataField {
  schema: string;
  element: string;
  qualifier: string | null;
  language?: string;
  value: string;
}

export interface ItemFile {
  id: string;
  name: string;
  blob: Blob;
  bundle: string;
  description?: string;
  primary?: boolean;
}

export interface PendingFileRef {
  bundle: string;
  name: string;
  primary?: boolean;
  description?: string;
}

export interface Item {
  key: number;
  csvRow: number;
  metadata: MetadataField[];
  fileRefs: PendingFileRef[];
  files: ItemFile[];
  collections: string[];
  handle: string;
}