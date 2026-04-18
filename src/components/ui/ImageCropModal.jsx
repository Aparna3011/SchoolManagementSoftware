import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { getCroppedImageDataUrl } from '../../utils/cropImage';

const DEFAULT_ASPECT_OPTIONS = [
  { value: '0.7777777778', label: 'Passport (35:45)' },
  { value: '1', label: 'Square (1:1)' },
  { value: '1.3333333333', label: 'Landscape (4:3)' },
];

export function ImageCropModal({
  isOpen,
  title = 'Crop Image',
  imageSrc,
  onClose,
  onApply,
  aspectOptions = DEFAULT_ASPECT_OPTIONS,
  defaultAspect = '0.7777777778',
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectValue, setAspectValue] = useState(defaultAspect);
  const [cropPixels, setCropPixels] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectValue(defaultAspect);
    setCropPixels(null);
    setSubmitting(false);
  }, [isOpen, defaultAspect]);

  const numericAspect = useMemo(() => {
    const parsed = Number.parseFloat(aspectValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [aspectValue]);

  async function handleApply() {
    if (!imageSrc || !cropPixels || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const croppedDataUrl = await getCroppedImageDataUrl(imageSrc, cropPixels);
      onApply?.({
        croppedDataUrl,
        aspect: numericAspect,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={title}
      maxWidth="780px"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={handleApply} disabled={!imageSrc || !cropPixels || submitting}>
            {submitting ? 'Applying...' : 'Apply Crop'}
          </Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Crop Ratio"
            name="crop-ratio"
            value={aspectValue}
            onChange={(event) => setAspectValue(event.target.value)}
            options={aspectOptions}
            placeholder="Select ratio"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="crop-zoom" className="text-sm font-medium text-slate-900">Zoom</label>
            <input
              id="crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number.parseFloat(event.target.value))}
            />
          </div>
        </div>

        <div className="relative w-full h-110 bg-slate-900 rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={numericAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCropPixels(pixels)}
              objectFit="contain"
              showGrid={true}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
