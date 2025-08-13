
export interface Asset {
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export interface GeneratedAssetSets {
  pwa: Asset[];
  extension: Asset[];
}

export interface ImageInfo {
    url: string;
    width: number;
    height: number;
}
