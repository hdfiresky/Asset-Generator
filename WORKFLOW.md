# Asset Generator Pro: Application Workflow

This document outlines the technical workflow and user journey of the Asset Generator Pro application.

## User Journey

The application guides the user through a clear, sequential, three-step process.

1.  **Step 1: Upload Logo**
    *   The user arrives and is presented with the first step: an upload area.
    *   They can either drag and drop an image file or click to open a file selection dialog.

2.  **Step 2: Preview & Generate**
    *   Once an image is selected, the application automatically processes it to remove the white background. A loading indicator shows the progress.
    *   The second step becomes active, revealing a preview of the logo with a transparent background. This allows the user to verify the background removal quality.
    *   If the preview looks correct, the user clicks the "Generate Assets" button to proceed.

3.  **Step 3: Download Assets**
    *   After the assets are generated, the third step becomes active.
    *   The generated assets are displayed in a clean, tabbed interface, separating "PWA Assets" and "Browser Extension Assets".
    *   Each tab shows a grid of asset previews with their filenames and dimensions.
    *   The user can download a complete `.zip` archive for each category by clicking the "Download .zip" button.

## Technical Workflow

The application is built with React and TypeScript. The core logic is orchestrated by the `App` component using a state-driven, multi-step approach.

### 1. State Management (`App.tsx`)

The main `App` component manages the application's state to guide the user through the wizard:
-   `currentStep`: A number (`1`, `2`, `3`) that controls which step of the wizard is active.
-   `originalFile`: The raw `File` object uploaded by the user.
-   `imageInfo`: Stores the URL and dimensions of the *original* uploaded image.
-   `processedPreviewUrl`: A data URL for the image *after* background removal, used in the Step 2 preview.
-   `generatedAssets`: Holds the final PWA and Extension asset sets after generation.
-   `isLoading`/`loadingMessage`: A boolean and string to control the display of loading spinners and messages.
-   `error`: Stores any error message that occurs during processing.

### 2. Step 1: Image Upload and Processing (`handleImageSelect` in `App.tsx`)

-   The `ImageUploader` component captures the user's file.
-   The `handleImageSelect` callback is triggered. It resets the application state and sets `isLoading` to true.
-   `createImageFromFile()` and `removeWhiteBackground()` (from `lib/imageUtils.ts`) are called to process the image immediately.
    -   `removeWhiteBackground` draws the image on a canvas, iterates through pixels, makes white/near-white pixels transparent, and returns a new `image/png` data URL.
-   The resulting transparent data URL is stored in `processedPreviewUrl`.
-   `currentStep` is updated to `2`, which automatically reveals the next step in the UI.

### 3. Step 2: Asset Generation (`handleGenerateAssets` in `App.tsx`)

-   This step is only active when `currentStep` is `2`.
-   The user sees the `processedPreviewUrl` and clicks "Generate Assets".
-   The `handleGenerateAssets` function is called:
    -   It sets `isLoading` to true.
    -   It calls `createImageFromUrl(processedPreviewUrl)` to create an `HTMLImageElement` from the already-processed image. This is efficient as the background removal is not repeated.
    -   It defines the target asset sizes for PWA and Browser Extensions.
    -   It uses `Promise.all` to run all `resizeImage()` operations in parallel.
    -   `resizeImage` creates a canvas for each target size, draws the source image centered within it (letterboxing with transparency), and resolves with an `Asset` object containing the blob, URL, and dimensions.
-   Once all assets are generated, they are stored in `generatedAssets`, and `currentStep` is updated to `3`.

### 4. Step 3: Display and Download (`ResultDisplay.tsx` and `handleDownloadZip`)

-   The `ResultDisplay` component becomes visible. It's a controlled component that takes the `generatedAssets` as a prop.
-   It uses its own internal state to manage the active tab ('pwa' or 'extension').
-   It renders a grid of `AssetPreview` components for the selected tab.
-   When a "Download .zip" button is clicked, it calls the `handleDownloadZip` function (passed from `App.tsx`), specifying which asset type to download.
-   `handleDownloadZip` uses the `JSZip` library to create a zip archive from the asset blobs and triggers a browser download.

### 5. Memory Management

-   A `useEffect` hook in `App.tsx` contains a cleanup function.
-   This function revokes all created object URLs (`asset.url` and `processedPreviewUrl`) when the component unmounts or when the state is reset. This is crucial for preventing memory leaks.