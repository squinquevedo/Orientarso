import React, { useEffect, useRef, useState } from 'react';

const OUTPUT_SIZE = 320;

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer la imagen'));
    image.src = src;
  });
}

function distanceBetweenTouches(touches) {
  const [first, second] = touches;
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

async function cropProfilePhoto(sourceUrl, cropState, imageMeta) {
  const image = await createImage(sourceUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const scaleOut = OUTPUT_SIZE / cropState.cropSize;
  const baseScale = Math.max(cropState.cropSize / imageMeta.width, cropState.cropSize / imageMeta.height);

  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  context.save();
  context.translate(
    OUTPUT_SIZE / 2 + cropState.offset.x * scaleOut,
    OUTPUT_SIZE / 2 + cropState.offset.y * scaleOut
  );
  context.rotate((cropState.rotation * Math.PI) / 180);
  context.scale(baseScale * cropState.zoom * scaleOut, baseScale * cropState.zoom * scaleOut);
  context.drawImage(image, -imageMeta.width / 2, -imageMeta.height / 2);
  context.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        resolve(new File([blob], 'foto-perfil.webp', { type: 'image/webp' }));
      },
      'image/webp',
      0.74
    );
  });
}

function ProfilePhotoModal({ currentPhoto, placeholderIcon, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageMeta, setImageMeta] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 360, height: 520 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const measureStage = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    measureStage();
    window.addEventListener('resize', measureStage);
    return () => window.removeEventListener('resize', measureStage);
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const cropSize = Math.min(stageSize.width * 0.9, stageSize.height * 0.74, 560);
  const baseScale = imageMeta ? Math.max(cropSize / imageMeta.width, cropSize / imageMeta.height) : 1;
  const imageWidth = imageMeta ? imageMeta.width * baseScale * zoom : cropSize;
  const imageHeight = imageMeta ? imageMeta.height * baseScale * zoom : cropSize;
  const previewSrc = sourceUrl || currentPhoto;

  const resetCrop = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setError('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(URL.createObjectURL(file));
    setImageMeta(null);
    resetCrop();
    event.target.value = '';
  };

  const handleImageLoad = (event) => {
    setImageMeta({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    });
  };

  const handlePointerDown = (event) => {
    if (!sourceUrl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const endPointerDrag = () => {
    dragRef.current = null;
  };

  const handleWheel = (event) => {
    if (!sourceUrl) return;
    event.preventDefault();
    const nextZoom = zoom - event.deltaY * 0.0015;
    setZoom(Math.min(Math.max(nextZoom, 1), 4));
  };

  const handleTouchStart = (event) => {
    if (!sourceUrl || event.touches.length !== 2) return;
    pinchRef.current = {
      distance: distanceBetweenTouches(event.touches),
      zoom,
    };
  };

  const handleTouchMove = (event) => {
    if (!sourceUrl || event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    const nextZoom = pinchRef.current.zoom * (distanceBetweenTouches(event.touches) / pinchRef.current.distance);
    setZoom(Math.min(Math.max(nextZoom, 1), 4));
  };

  const handleTouchEnd = () => {
    pinchRef.current = null;
  };

  const handleSave = async () => {
    if (!sourceUrl || !imageMeta) {
      fileInputRef.current?.click();
      return;
    }

    setSaving(true);
    setError('');
    try {
      const croppedPhoto = await cropProfilePhoto(
        sourceUrl,
        { cropSize, zoom, offset, rotation },
        imageMeta
      );
      await onSave(croppedPhoto);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'No se pudo guardar la foto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wa-photo-editor" role="dialog" aria-modal="true">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="photo-file-input"
        onChange={handleFileChange}
      />

      <div
        ref={stageRef}
        className={`wa-photo-stage ${sourceUrl ? 'is-editing' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Foto de perfil"
            className="wa-photo-image"
            onLoad={handleImageLoad}
            style={
              sourceUrl
                ? {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
                  }
                : undefined
            }
            draggable="false"
          />
        ) : (
          <button className="wa-photo-empty" type="button" onClick={() => fileInputRef.current?.click()}>
            <img src={placeholderIcon} alt="" />
            <span>Subir foto</span>
          </button>
        )}

        {sourceUrl && (
          <>
            <div className="wa-crop-shade" />
            <div
              className="wa-crop-frame"
              style={{ width: `${cropSize}px`, height: `${cropSize}px` }}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
              <span />
            </div>
          </>
        )}
      </div>

      {error && <div className="wa-photo-error">{error}</div>}

      {sourceUrl && (
        <div className="wa-zoom-control">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Ajustar zoom de la foto"
          />
        </div>
      )}

      <div className="wa-photo-toolbar">
        <button className="wa-toolbar-btn text" type="button" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button
          className="wa-toolbar-btn rotate"
          type="button"
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          disabled={!sourceUrl || saving}
          aria-label="Rotar foto"
        >
          ↻
        </button>
        {sourceUrl ? (
          <button className="wa-toolbar-btn text" type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'OK'}
          </button>
        ) : (
          <button className="wa-toolbar-btn text" type="button" onClick={() => fileInputRef.current?.click()}>
            Subir
          </button>
        )}
      </div>
    </div>
  );
}

export default ProfilePhotoModal;
