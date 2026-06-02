import React, { useEffect, useState } from 'react';
import { FlipHorizontal2, FlipVertical2, Palette, RotateCcw, Save } from 'lucide-react';
import SpriteGraphic from './SpriteGraphic';

const parseSvgDocument = (markup) => {
  const parser = new DOMParser();
  return parser.parseFromString(markup, 'image/svg+xml');
};

const serializeSvgDocument = (doc) => new XMLSerializer().serializeToString(doc);

const updateStyleValue = (styleValue, propertyName, propertyValue) => {
  const entries = styleValue
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(':'))
    .filter(([name]) => name)
    .map(([name, value]) => [name.trim(), (value || '').trim()]);

  const nextEntries = entries.filter(([name]) => name !== propertyName);

  if (propertyValue) {
    nextEntries.push([propertyName, propertyValue]);
  }

  return nextEntries.map(([name, value]) => `${name}:${value}`).join(';');
};

const ensureSvgMarkup = (markup) => {
  const doc = parseSvgDocument(markup);
  const svg = doc.querySelector('svg');

  if (!svg) {
    throw new Error('This sprite does not contain valid SVG markup.');
  }

  return { doc, svg };
};

const updateRootFlip = (markup, axis) => {
  const { doc, svg } = ensureSvgMarkup(markup);
  const nextFlipX = axis === 'x' ? svg.getAttribute('data-flip-x') !== 'true' : svg.getAttribute('data-flip-x') === 'true';
  const nextFlipY = axis === 'y' ? svg.getAttribute('data-flip-y') !== 'true' : svg.getAttribute('data-flip-y') === 'true';
  const scaleX = nextFlipX ? -1 : 1;
  const scaleY = nextFlipY ? -1 : 1;

  svg.setAttribute('data-flip-x', nextFlipX ? 'true' : 'false');
  svg.setAttribute('data-flip-y', nextFlipY ? 'true' : 'false');

  const styleValue = svg.getAttribute('style') || '';
  const withOrigin = updateStyleValue(styleValue, 'transform-origin', 'center');
  const withBox = updateStyleValue(withOrigin, 'transform-box', 'fill-box');
  svg.setAttribute('style', updateStyleValue(withBox, 'transform', `scale(${scaleX}, ${scaleY})`));

  return serializeSvgDocument(doc);
};

export default function SpritePaintEditor({
  sprite,
  markup,
  size = 100,
  loadError = '',
  onApply,
  onReset,
  onSizeChange,
}) {
  const [draftMarkup, setDraftMarkup] = useState(markup);
  const [editorError, setEditorError] = useState(loadError);
  const [draftSize, setDraftSize] = useState(size);

  useEffect(() => {
    setDraftMarkup(markup);
  }, [markup]);

  useEffect(() => {
    setDraftSize(size);
  }, [size]);

  useEffect(() => {
    setEditorError(loadError);
  }, [loadError]);

  useEffect(() => {
    if (!draftMarkup) {
      return;
    }

    try {
      ensureSvgMarkup(draftMarkup);
      setEditorError(loadError);
    } catch (error) {
      setEditorError(error.message || 'Unable to parse this sprite.');
    }
  }, [draftMarkup, loadError]);

  const isMarkupReady = /<svg[\s>]/i.test(draftMarkup);

  const handleFlip = (axis) => {
    try {
      setDraftMarkup((currentMarkup) => updateRootFlip(currentMarkup, axis));
      setEditorError(loadError);
    } catch (error) {
      setEditorError(error.message || 'Unable to update the sprite.');
    }
  };

  const handleSizeInputChange = (event) => {
    const nextValue = Number(event.target.value);
    setDraftSize(nextValue);
    onSizeChange?.(nextValue);
  };

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-orange-700">Sprite Editor</div>
              <div className="text-xs text-orange-700/80">{sprite.name}</div>
            </div>
            <Palette size={16} className="text-orange-500" />
          </div>
          <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border border-orange-100 bg-white">
            <div className="h-40 w-40">
              <SpriteGraphic
                src={sprite.src}
                markup={draftMarkup || sprite.svgMarkup}
                color={sprite.color}
                width="160"
                height="160"
                className="block"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 text-sm font-semibold text-gray-900">Sprite Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFlip('x')}
              disabled={!isMarkupReady}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 ${!isMarkupReady ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <FlipHorizontal2 size={14} />
              Flip X
            </button>
            <button
              type="button"
              onClick={() => handleFlip('y')}
              disabled={!isMarkupReady}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 ${!isMarkupReady ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <FlipVertical2 size={14} />
              Flip Y
            </button>
            <button
              type="button"
              onClick={() => onReset()}
              disabled={!isMarkupReady}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 ${!isMarkupReady ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              type="button"
              onClick={() => onApply(draftMarkup)}
              disabled={!isMarkupReady}
              className={`inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white ${!isMarkupReady ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Save size={14} />
              Apply
            </button>
          </div>
          <div className="mt-4 rounded-xl bg-white px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-gray-800">
              <span>Initial Size</span>
              <span>{draftSize}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="1"
              value={draftSize}
              onChange={handleSizeInputChange}
              className="w-full"
            />
            <input
              type="number"
              min="10"
              max="300"
              step="1"
              value={draftSize}
              onChange={handleSizeInputChange}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
            />
          </div>
          <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-gray-700">
            {isMarkupReady
              ? 'Flip the sprite, set its initial size, reset it to the original asset, or apply the current version to this sprite.'
              : 'Loading sprite SVG into the editor.'}
          </div>
          {editorError && (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {editorError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
