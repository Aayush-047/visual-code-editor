const parseSvgDocument = (markup) => {
  const parser = new DOMParser();
  return parser.parseFromString(markup, 'image/svg+xml');
};

const serializeSvgDocument = (doc) => new XMLSerializer().serializeToString(doc);

export const updateStyleValue = (styleValue, propertyName, propertyValue) => {
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

export const ensureSvgMarkup = (markup) => {
  const doc = parseSvgDocument(markup);
  const svg = doc.querySelector('svg');

  if (!svg) {
    throw new Error('This sprite does not contain valid SVG markup.');
  }

  return { doc, svg };
};

export const updateRootFlip = (markup, axis) => {
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
