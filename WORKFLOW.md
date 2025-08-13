
# Asset Generator Pro: Application Workflow

This document outlines the technical workflow and user journey of the Asset Generator Pro application.

## User Journey

1.  **Landing Page**: The user arrives at the application, which presents a clean interface for uploading an image.
2.  **Image Upload**: The user can either drag and drop an image file onto the designated area or click to open a file selection dialog.
3.  **Image Preview**: Once an image is selected, a preview is displayed along with its original dimensions. The user can choose to replace the image at this stage.
4.  **Asset Generation**: The user clicks the "Generate Assets" button. A loading indicator appears to signify that processing has begun.
5.  **View Results**: After a short processing time, the loading indicator disappears, and the generated assets are displayed. They are organized into two sections: "PWA Assets" and "Browser Extension Assets". Each asset shows a preview, its filename, and its dimensions.
6.  **Download Assets**: Each section has a "Download .zip" button. Clicking this button downloads a zip archive containing all the assets for that category (PWA or Extension).

## Technical Workflow

The application is built with React and TypeScript. The core logic is contained within the `App` component and its helper utilities.

### 1. State Management (`App.tsx`)

The main `App` component manages the application's state:
-   `originalFile`: The raw `File` object uploaded by the user.
-   `imageInfo`: Stores the URL, width, and height of the uploaded image for preview.
-   `generatedAssets`: Holds the generated PWA and Extension asset sets after processing.
-   `isLoading`: A boolean flag to control the display of the loading spinner.
-   `error`: Stores any error message that occurs during processing.

### 2. Image Upload (`components/ImageUploader.tsx`)

-   The `ImageUploader` component provides the UI for file selection.
-   It handles both file input changes and drag-and-drop events.
-   When a valid image file is received, it calls the `onImageSelect` prop, passing the `File` object up to the `App` component.
-   The `App` component's `handleImageSelect` callback then updates the `originalFile` and `imageInfo` state, triggering a re-render to show the preview.

### 3. Asset Generation Process (`handleGenerateAssets` in `App.tsx`)

This process is initiated when the "Generate Assets" button is clicked. It orchestrates several steps using utility functions from `lib/imageUtils.ts`.

1.  **Set Loading State**: `isLoading` is set to `true`.

2.  **Create Image Element**: `createImageFromFile(originalFile)` is called to convert the `File` object into an `HTMLImageElement`.

3.  **Remove White Background**: `removeWhiteBackground(originalImage)` is called. This function:
    -   Draws the image onto a temporary `<canvas>`.
    -   Reads the pixel data using `ctx.getImageData()`.
    -   Iterates through each pixel. If a pixel's color is within a certain `tolerance` of pure white, its alpha channel is set to `0` (fully transparent).
    -   Returns a new `image/png` data URL of the modified image.

4.  **Create Processed Image Element**: `createImageFromUrl(transparentImageUrl)` is called to create a new `HTMLImageElement` from the transparent data URL. This is the base image that will be used for all subsequent resizing.

5.  **Define Asset Sizes**: Two arrays (`pwaSizes`, `extensionSizes`) define the required dimensions and filenames for each asset pack.

6.  **Parallel Resizing**: `resizeImage()` is called for each required size. `Promise.all` is used to run all resizing operations in parallel for efficiency. The `resizeImage` function:
    -   Creates a new `<canvas>` with the target dimensions.
    -   Calculates the correct aspect ratio to fit the source image within the target canvas without distortion (letterboxing).
    -   Draws the centered, scaled image onto the canvas. The empty space is transparent.
    -   Converts the canvas content to a `Blob` using `canvas.toBlob()`.
    -   Creates an object URL from the blob for previewing (`URL.createObjectURL(blob)`).
    -   Resolves with an `Asset` object containing the `name`, `blob`, `url`, and dimensions.

7.  **Update State**: Once all promises resolve, the `generatedAssets` state is updated with the arrays of PWA and Extension assets. `isLoading` is set to `false`. The UI re-renders to display the results in `AssetPreview` components.

### 4. Downloading (`handleDownloadZip` in `App.tsx`)

-   When a "Download .zip" button is clicked, it calls `handleDownloadZip` with the relevant array of `Asset` objects.
-   It uses the `JSZip` library to create a new zip archive in memory.
-   It iterates through the assets, adding each asset's `blob` to the zip file under its specified `name`.
-   `zip.generateAsync({type:"blob"})` creates the final zip file as a blob.
-   A temporary `<a>` element is created, its `href` is set to an object URL of the zip blob, its `download` attribute is set, and it's programmatically clicked to initiate the download.
-   The temporary element and its object URL are immediately cleaned up.

### 5. Memory Management

-   The `App` component uses a `useEffect` hook with a cleanup function to revoke all created blob object URLs (`asset.url`) when the component unmounts or when new assets are generated. This prevents memory leaks.
