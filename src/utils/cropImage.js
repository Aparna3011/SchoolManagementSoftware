function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Crop an image using pixel bounds returned by react-easy-crop.
 * Returns a data URL that can be previewed and uploaded directly.
 */
export async function getCroppedImageDataUrl(imageSrc, cropPixels, mimeType = 'image/jpeg', quality = 0.92) {
  if (!imageSrc || !cropPixels) {
    throw new Error('Image source and crop area are required.');
  }

  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to initialize canvas context.');
  }

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  return canvas.toDataURL(mimeType, quality);
}
