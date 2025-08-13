
/**
 * Defines the core data structures used throughout the application.
 */

/**
 * Represents a single generated image asset.
 */
export interface Asset {
  /** The filename for the asset (e.g., 'icon128.png'). */
  name: string;
  /** The image data as a Blob, used for creating downloads. */
  blob: Blob;
  /** An object URL created from the blob, used for displaying the image preview. */
  url: string;
  /** The width of the asset in pixels. */
  width: number;
  /** The height of the asset in pixels. */
  height: number;
}

/**
 * Represents the complete set of generated assets, organized by type.
 */
export interface GeneratedAssetSets {
  /** An array of assets for Progressive Web Apps (PWA). */
  pwa: Asset[];
  /** An array of assets for Browser Extensions. */
  extension: Asset[];
}

/**
 * Represents basic information about an uploaded image for preview purposes.
 */
export interface ImageInfo {
    /** A data URL or object URL for displaying the image. */
    url: string;
    /** The original width of the image in pixels. */
    width: number;
    /** The original height of the image in pixels. */
    height: number;
}
