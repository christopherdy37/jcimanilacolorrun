# Images Directory

This folder contains all images used on the JCI Manila Color Run website.

## Folder Structure

- **hero/** - Hero section images (main banner, event photos)
- **events/** - Event-related images (past events, activities)
- **sponsors/** - Sponsor logos and branding
- **gallery/** - General gallery images

## Usage in Next.js

To use images in your components, reference them from the root `/images/` path:

```tsx
// Example usage
<Image 
  src="/images/hero/color-run-banner.jpg" 
  alt="JCI Manila Color Run"
  width={1200}
  height={600}
/>
```

## Image Guidelines

- **Format**: Use JPG for photos, PNG for logos with transparency
- **Optimization**: Compress images before uploading for better performance
- **Naming**: Use descriptive, kebab-case names (e.g., `hero-banner.jpg`)
- **Sizes**: 
  - Hero images: 1920x1080 or similar wide format
  - Sponsor logos: 300x200 or similar
  - Gallery images: 1200x800 or similar

## Next.js Image Optimization

The Next.js `Image` component automatically optimizes images. Always use it instead of regular `<img>` tags:

```tsx
import Image from 'next/image'

<Image
  src="/images/hero/event-photo.jpg"
  alt="Event description"
  width={1200}
  height={600}
  priority // For above-the-fold images
/>
```

