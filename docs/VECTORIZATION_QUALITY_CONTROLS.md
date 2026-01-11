# Vectorization Quality Controls

## Overview

The vectorization feature now includes quality control options that allow users to balance between speed and detail when converting raster images to SVG vectors.

## Quality Presets

### Low Quality (Fast, Simple)
- **Mode**: Polygon
- **Path Precision**: 2
- **Color Precision**: 1
- **Max Iterations**: 15
- **Filter Speckle**: 3
- **Use Case**: Quick previews, simple graphics, when file size is more important than detail

### Medium Quality (Balanced) - Default
- **Mode**: Spline
- **Path Precision**: 4
- **Color Precision**: 2
- **Max Iterations**: 40
- **Filter Speckle**: 1
- **Use Case**: General purpose vectorization, good balance of quality and speed

### High Quality (Maximum Quality)
- **Mode**: Spline
- **Path Precision**: 8 (Maximum)
- **Color Precision**: 4 (Maximum)
- **Max Iterations**: 100 (Maximum)
- **Filter Speckle**: 0.5 (Minimal filtering)
- **Corner Threshold**: 0.1 (Enhanced corner detection)
- **Length Threshold**: 0.1 (Enhanced path detail)
- **Splice Threshold**: 0.1 (Enhanced path optimization)
- **Layer Difference**: 0.1 (Better layer separation)
- **Use Case**: Final production images, maximum detail and accuracy required

## Configuration Options

The vectorization library supports additional advanced options:

### Mode Options
- **`spline`**: Smooth curves (best quality, slower)
- **`polygon`**: Straight lines (faster, simpler)
- **`none`**: No vectorization mode

### Precision Controls
- **`path_precision`**: Higher values = more precise paths (1-10 recommended)
- **`color_precision`**: Higher values = more accurate colors (0.5-5 recommended)

### Optimization Controls
- **`max_iterations`**: More iterations = better quality but slower (10-100)
- **`filter_speckle`**: Removes small artifacts (1-10, lower = less filtering)

### Background Options
- **`drop_background`**: Remove background during vectorization
- **`drop_transparent`**: Remove transparent areas

## UI Implementation

Users can select quality when clicking the "Vectorize" button:
1. Click the Vectorize button (document icon)
2. A popover appears with quality selector
3. Choose: Low, Medium, or High
4. Click "Vectorize" to start

## API Usage

\`\`\`typescript
const formData = new FormData()
formData.append("imageUrl", imageUrl)
formData.append("quality", "high") // "low" | "medium" | "high"

const response = await fetch("/api/image/vectorize", {
  method: "POST",
  body: formData,
})
\`\`\`

## Technical Details

The quality settings are applied via the `@imgly/vectorizer` library's `Config` object:

\`\`\`typescript
// High Quality (Maximum) Configuration
const config = {
  options: {
    mode: "spline",
    path_precision: 8, // Maximum path precision
    color_precision: 4, // Maximum color accuracy
    max_iterations: 100, // Maximum iterations
    filter_speckle: 0.5, // Minimal filtering
    corner_threshold: 0.1, // Enhanced corner detection
    length_threshold: 0.1, // Enhanced path detail
    splice_threshold: 0.1, // Enhanced optimization
    layer_difference: 0.1, // Better layer separation
  },
  callbacks: {
    progress: (message, current, total) => {
      console.log(`Progress: ${current}/${total}`)
    },
  },
}

const svgBlob = await imageToSvg(image, config)
\`\`\`

## Performance Considerations

- **Low Quality**: ~1-3 seconds for typical images
- **Medium Quality**: ~3-8 seconds for typical images
- **High Quality**: ~15-60+ seconds for complex images (maximum quality processing)

Processing time increases with:
- Image resolution
- Image complexity
- Number of colors
- Quality preset level

## Recommendations

- Use **Low** for quick previews and simple graphics
- Use **Medium** for most production use cases (default)
- Use **High** for final assets where maximum quality is required
- Consider image complexity - simple graphics may not benefit from High quality
