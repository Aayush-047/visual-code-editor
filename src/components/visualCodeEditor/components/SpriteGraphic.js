import React, { useEffect, useState } from 'react';
import CatSprite from './CatSprite';

const svgMarkupCache = new Map();
const svgPendingCache = new Map();
const ROOT_SVG_STYLE = 'width:100%;height:100%;display:block;';

const mergeRootSvgStyle = (markup) => {
  if (!markup || !/<svg[\s>]/i.test(markup)) {
    return markup;
  }

  return markup.replace(/<svg\b([^>]*)>/i, (fullMatch, attributes = '') => {
    const styleMatch = attributes.match(/\sstyle=(['"])(.*?)\1/i);

    if (styleMatch) {
      const quote = styleMatch[1];
      const existingStyle = styleMatch[2];
      const normalizedExistingStyle = existingStyle.trim().endsWith(';') || existingStyle.trim() === ''
        ? existingStyle.trim()
        : `${existingStyle.trim()};`;
      const mergedStyle = normalizedExistingStyle.includes(ROOT_SVG_STYLE)
        ? normalizedExistingStyle
        : `${normalizedExistingStyle}${ROOT_SVG_STYLE}`;

      return `<svg${attributes.replace(styleMatch[0], ` style=${quote}${mergedStyle}${quote}`)}>`;
    }

    return `<svg${attributes} style="` + ROOT_SVG_STYLE + '">';
  });
};

const loadSpriteMarkup = async (src) => {
  if (!src) {
    return null;
  }

  if (svgMarkupCache.has(src)) {
    return svgMarkupCache.get(src);
  }

  if (svgPendingCache.has(src)) {
    return svgPendingCache.get(src);
  }

  const request = fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load sprite asset: ${src}`);
      }
      return response.text();
    })
    .then((markup) => {
      const normalizedMarkup = mergeRootSvgStyle(markup);
      svgMarkupCache.set(src, normalizedMarkup);
      svgPendingCache.delete(src);
      return normalizedMarkup;
    })
    .catch((error) => {
      svgPendingCache.delete(src);
      throw error;
    });

  svgPendingCache.set(src, request);
  return request;
};

const normalizeDimension = (value) => {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
    return `${value}px`;
  }

  return value;
};

export default function SpriteGraphic({
  src,
  markup: providedMarkup = null,
  color = '#FFAB19',
  width = '95.17898101806641',
  height = '100.04156036376953',
  className = '',
}) {
  const [markup, setMarkup] = useState(() => providedMarkup || (src ? svgMarkupCache.get(src) || null : null));
  const normalizedWidth = normalizeDimension(width);
  const normalizedHeight = normalizeDimension(height);

  useEffect(() => {
    if (providedMarkup) {
      setMarkup(providedMarkup);
      return undefined;
    }

    let isCancelled = false;

    if (!src) {
      setMarkup(null);
      return undefined;
    }

    void loadSpriteMarkup(src)
      .then((nextMarkup) => {
        if (!isCancelled) {
          setMarkup(nextMarkup);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setMarkup(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [providedMarkup, src]);

  if (!markup) {
    return <CatSprite color={color} width={width} height={height} className={className} />;
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: normalizedWidth,
        height: normalizedHeight,
        color,
        '--sprite-fill': color,
        lineHeight: 0,
      }}
    >
      <span
        style={{ display: 'inline-block', width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </span>
  );
}
