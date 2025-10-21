# PWA Icons

This directory contains the required PWA icons for Sora2 AI Video Generator.

## Required Icons

The following icons need to be generated from your logo/favicon:

1. **icon-192.png** - 192x192px PNG (standard icon)
2. **icon-512.png** - 512x512px PNG (standard icon)
3. **icon-maskable-192.png** - 192x192px PNG (maskable with safe zone)
4. **icon-maskable-512.png** - 512x512px PNG (maskable with safe zone)
5. **apple-touch-icon.png** - 180x180px PNG (iOS home screen)

## How to Generate Icons

### Option 1: Using Online Tools

1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your source logo (ideally 512x512 or larger)
3. Download the generated icon pack
4. Place the icons in this directory

### Option 2: Using ImageMagick (Command Line)

If you have a source SVG or high-resolution PNG:

```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Convert favicon.svg to different sizes
convert -background none -resize 192x192 ../favicon.svg icon-192.png
convert -background none -resize 512x512 ../favicon.svg icon-512.png
convert -background none -resize 180x180 ../favicon.svg apple-touch-icon.png

# For maskable icons, add padding (safe zone)
convert -background none -resize 154x154 -gravity center -extent 192x192 ../favicon.svg icon-maskable-192.png
convert -background none -resize 410x410 -gravity center -extent 512x512 ../favicon.svg icon-maskable-512.png
```

### Option 3: Using Sharp (Node.js)

Create a script `generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

async function generateIcons() {
  for (const icon of sizes) {
    const resize = icon.maskable ? Math.floor(icon.size * 0.8) : icon.size;

    await sharp('./favicon.svg')
      .resize(resize, resize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: icon.maskable ? Math.floor((icon.size - resize) / 2) : 0,
        bottom: icon.maskable ? Math.ceil((icon.size - resize) / 2) : 0,
        left: icon.maskable ? Math.floor((icon.size - resize) / 2) : 0,
        right: icon.maskable ? Math.ceil((icon.size - resize) / 2) : 0,
        background: { r: 102, g: 126, b: 234, alpha: 1 } // Theme color
      })
      .png()
      .toFile(`./icons/${icon.name}`);

    console.log(`Generated ${icon.name}`);
  }
}

generateIcons();
```

Then run:
```bash
npm install sharp
node generate-icons.js
```

## Maskable Icons

Maskable icons have a "safe zone" where the important content should be placed. The safe zone is 80% of the icon size, centered. The remaining 20% may be masked by the platform.

### Design Guidelines:
- Keep important visual elements in the center 80% of the icon
- Use solid background color matching your theme
- Ensure icon works well when masked into different shapes (circle, squircle, rounded square)

## Testing Your Icons

1. **Chrome DevTools**:
   - Open DevTools > Application > Manifest
   - Check if all icons are listed correctly

2. **Lighthouse**:
   - Run a Lighthouse PWA audit
   - Check for any icon-related warnings

3. **PWA Testing Tool**:
   - Visit: https://www.pwabuilder.com/
   - Enter your site URL
   - Review icon recommendations

## Current Status

⚠️ **Icons need to be generated**

The manifest.json is configured to use these icons, but they need to be created from your source logo/favicon.

For now, the app will fall back to using favicon.svg for all icon purposes.
