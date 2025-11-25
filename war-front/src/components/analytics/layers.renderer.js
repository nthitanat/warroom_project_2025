// Build consistent layer IDs
export const layerId = (spec) => `${spec.id}-layer`;
export const labelLayerId = (spec) => `${spec.id}-labels`;

// Track which map layer IDs have event bindings
const bound = new Set();

export const ensureVectorSource = (map, spec) => {
  if (!map.getSource(spec.sourceId)) {
    map.addSource(spec.sourceId, {
      type: 'vector',
      tiles: spec.tiles,
      minzoom: 0,
      maxzoom: 14
    });
  }
};

export const removeLayerCompletely = (map, spec) => {
  const baseId = layerId(spec);
  const lblId = labelLayerId(spec);
  if (map.getLayer(lblId)) map.removeLayer(lblId);
  if (map.getLayer(baseId)) map.removeLayer(baseId);
  if (map.getSource(spec.sourceId)) map.removeSource(spec.sourceId);
  unbindInteractivity(map, spec);
};

export const addOrReplaceBase = (map, spec) => {
  const id = layerId(spec);
  if (map.getLayer(id)) map.removeLayer(id);

  const type =
    spec.geometry === 'line' ? 'line' :
    spec.geometry === 'fill' ? 'fill' : 'circle';

  const layer = {
    id,
    type,
    source: spec.sourceId,
    'source-layer': spec.sourceLayer,
    minzoom: spec.minzoom ?? 0,
    maxzoom: spec.maxzoom ?? 24
  };
  if (spec.layout) layer.layout = spec.layout;
  if (spec.paint)  layer.paint  = spec.paint;

  map.addLayer(layer);
};

export const addOrReplaceLabel = (map, spec) => {
  if (!spec.labelConfig || spec.labelConfig === 'none') return;

  const id = labelLayerId(spec);
  if (map.getLayer(id)) map.removeLayer(id);

  const placement = spec.labelConfig.placement;
  const field = spec.labelConfig.field;

  const base = {
    id,
    source: spec.sourceId,
    'source-layer': spec.sourceLayer,
    minzoom: placement === 'line' ? 6 : 5,
    maxzoom: 24
  };

  map.addLayer({
    ...base,
    type: 'symbol',
    layout: {
      'symbol-placement': placement,
      'text-field': ['get', field],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 12, 12, 14, 16, 18],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'symbol-avoid-edges': false,
      ...(placement === 'line'
        ? {
            'symbol-spacing': 150,
            'text-max-angle': 60,
          }
        : {
            'text-offset': [0, 0.8],
            'text-anchor': 'top'
          }),
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
    },
    paint: {
      'text-color': '#333',
      'text-halo-color': '#fff',
      'text-halo-width': 1.5
    }
  });
};

export const buildPopupHTML = (props = {}, fields, customFormatter) => {
  if (customFormatter) return customFormatter(props);

  let entries;
  if (fields && fields.length > 0) {
    entries = fields.map((f) => {
      const key = typeof f === 'string' ? f : f.key;
      const label = typeof f === 'string' ? f : (f.label ?? f.key);
      return [label, props[key]];
    });
  } else {
    entries = Object.entries(props);
  }

  const rows =
    entries
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([label, v]) => {
        const val = String(v);
        return `<tr><th style="text-align:left;padding-right:8px;vertical-align:top;">${label}</th><td>${val}</td></tr>`;
      })
      .join('') || `<tr><td>No attributes</td></tr>`;

  const buttonHTML =
    props['layerId'] === 'village'
      ? `<div style="margin-top:8px;text-align:center;">
          <a href="/analytics/booking?name=${encodeURIComponent(
            props['Name'] || 'Unnamed Village'
          )}&id=${encodeURIComponent(props['id'] || '')}"
            class="book-btn" 
            style="display:inline-block;text-decoration:none;">
            Book Appointment
          </a>
        </div>`
      : '';

  return `
    <div style="color:black;font:13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <table>${rows}</table>
      ${buttonHTML}
    </div>
  `;
};

export const bindInteractivity = (map, spec) => {
  if (!spec.interactive) return;

  const ids = [layerId(spec), labelLayerId(spec)];

  ids.forEach((id) => {
    if (!map.getLayer(id) || bound.has(id)) return;

    map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));

    map.on('click', id, (e) => {
      const f = e.features?.[0];
      if (!f) return;

      const props = { ...(f.properties ?? {}), layerId: spec.id };
      const html = buildPopupHTML(props, spec.click?.fields, spec.click?.formatterHTML);

      const maplibregl = require('maplibre-gl');
      const popup = new maplibregl.Popup({ closeOnClick: true, maxWidth: '320px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);

      if (spec.id === 'village') {
        const btn = popup.getElement().querySelector('.book-btn');
        btn?.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('book-village', { detail: props }));
        });
      }
    });

    bound.add(id);
  });
};

export const unbindInteractivity = (map, spec) => {
  const ids = [layerId(spec), labelLayerId(spec)];
  ids.forEach((id) => {
    if (!bound.has(id)) return;
    map.off('mouseenter', id, undefined);
    map.off('mouseleave', id, undefined);
    map.off('click', id, undefined);
    bound.delete(id);
  });
};

export const syncOneLayer = (map, spec) => {
  ensureVectorSource(map, spec);
  addOrReplaceBase(map, spec);
  addOrReplaceLabel(map, spec);
  bindInteractivity(map, spec);
};
