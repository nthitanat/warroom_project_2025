const getBaseUrl = () => {
  // Use the API base URL from environment variable or default to localhost:5000/api
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
};

const createTileUrl = (layerPath) => {
  const baseUrl = getBaseUrl();
  // Note: baseUrl already includes '/api', so we just append the analytics endpoint
  return `${baseUrl}/analytics/tiles/${layerPath}/{z}/{x}/{y}.pbf`;
};

export const getLayers = () => [
  {
    id: 'contour20m',
    title: 'เส้นชั้นความสูง 20ม.',
    icon: 'terrain',
    sourceId: 'contour20m-src',
    tiles: [createTileUrl('contour20m')],
    sourceLayer: 'contour20m',
    geometry: 'line',
    interactive: true,
    paint: { 'line-color': '#666666', 'line-width': 1 },
    minzoom: 0,
    tileMaxZoom: 9,  // Actual tile data availability
    maxzoom: 22,     // Keep rendering beyond tile zoom using oversampling
    labelConfig: 'none',
    click: { enabled: true }
  },
  {
    id: 'contour50m',
    title: 'เส้นชั้นความสูง 50ม.',
    icon: 'landscape',
    sourceId: 'contour50m-src',
    tiles: [createTileUrl('contour50m')],
    sourceLayer: 'contour50m',
    geometry: 'line',
    interactive: true,
    paint: { 'line-color': '#444444', 'line-width': 1 },
    minzoom: 0,
    tileMaxZoom: 9,
    maxzoom: 22,
    labelConfig: 'none',
    click: { enabled: true }
  },
  {
    id: 'major_stream',
    title: 'ลำน้ำสายหลัก',
    icon: 'water',
    sourceId: 'major_stream-src',
    tiles: [createTileUrl('major_stream')],
    sourceLayer: 'major_stream',
    geometry: 'line',
    interactive: true,
    paint: { 'line-color': '#0000FF', 'line-width': 1.2 },
    minzoom: 0,
    tileMaxZoom: 11,
    maxzoom: 22,
    labelConfig: { placement: 'line', field: 'hy_mriver' },
    click: { enabled: true }
  },
  {
    id: 'minor_stream',
    title: 'ลำน้ำสายย่อย',
    icon: 'waves',
    sourceId: 'minor_stream-src',
    tiles: [createTileUrl('minor_stream')],
    sourceLayer: 'minor_stream',
    geometry: 'line',
    interactive: true,
    paint: { 'line-color': '#00BFFF', 'line-width': 1.2 },
    minzoom: 0,
    tileMaxZoom: 11,
    maxzoom: 22,
    labelConfig: { placement: 'line', field: 'HY_LNAME' },
    click: { enabled: true }
  },
  {
    id: 'drainage_system',
    title: 'พื้นที่รองรับน้ำ',
    icon: 'opacity',
    sourceId: 'drainage_system-src',
    tiles: [createTileUrl('drainage_system')],
    sourceLayer: 'drainage_system',
    geometry: 'line',
    interactive: true,
    paint: {
      'line-color': [
        'let', 'val',
        [
          'coalesce',
          [
            'to-number',
            [
              'slice',
              ['get', 'Name'],
              0,
              ['index-of', ' ', ['get', 'Name']]
            ]
          ],
          0
        ],
        [
          'interpolate', ['linear'], ['var', 'val'],
          0,  '#a6cee3',
          1,  '#1f78b4',
          5,  '#225ea8',
          10, '#08306b'
        ]
      ],
      'line-width': [
        'let', 'val',
        [
          'coalesce',
          [
            'to-number',
            [
              'slice',
              ['get', 'Name'],
              0,
              ['index-of', ' ', ['get', 'Name']]
            ]
          ],
          0
        ],
        [
          'interpolate', ['linear'], ['zoom'],
          5,
          [
            'interpolate', ['linear'], ['var', 'val'],
            0, 0.4,
            1, 0.6,
            5, 0.9,
            10, 1.2
          ],
          10,
          [
            'interpolate', ['linear'], ['var', 'val'],
            0, 0.6,
            1, 1.2,
            5, 2.0,
            10, 3.0
          ],
          14,
          [
            'interpolate', ['linear'], ['var', 'val'],
            0, 0.8,
            1, 1.5,
            5, 3.0,
            10, 5.0
          ]
        ]
      ]
    },
    minzoom: 0,
    tileMaxZoom: 10,
    maxzoom: 22,
    labelConfig: 'none',
    click: { enabled: true }
  },
  {
    id: 'ridge',
    title: 'เส้นสันเขา',
    icon: 'mountain',
    sourceId: 'ridge-src',
    tiles: [createTileUrl('ridge')],
    sourceLayer: 'ridge',
    geometry: 'line',
    paint: { 'line-color': '#444444', 'line-width': 1 },
    minzoom: 0,
    tileMaxZoom: 10,
    maxzoom: 22,
    labelConfig: 'none',
    interactive: true,
    click: { enabled: true }
  },
  {
    id: 'roadxvalley',
    title: 'จุดเสี่ยงน้ำตัดถนน',
    icon: 'warning',
    sourceId: 'roadxvalley-src',
    tiles: [createTileUrl('roadxvalley')],
    sourceLayer: 'roadxvalley',
    geometry: 'circle',
    paint: {
      'circle-radius': 3,
      'circle-color': '#1ee940ff',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    },
    minzoom: 0,
    tileMaxZoom: 13,
    maxzoom: 22,
    labelConfig: 'none',
    interactive: true,
    click: { enabled: true }
  },
  {
    id: 'roadxridge',
    title: 'จุดอพยพหนีน้ำท่วม',
    icon: 'shield',
    sourceId: 'roadxridge-src',
    tiles: [createTileUrl('roadxridge')],
    sourceLayer: 'roadxridge',
    geometry: 'circle',
    paint: {
      'circle-radius': 3,
      'circle-color': '#e91e63',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    },
    minzoom: 0,
    tileMaxZoom: 13,
    maxzoom: 22,
    labelConfig: 'none',
    interactive: true,
    click: { enabled: true }
  },
  {
    id: 'village',
    title: 'หมู่บ้านเสี่ยงต่อน้ำท่วม',
    icon: 'home',
    sourceId: 'village-src',
    tiles: [createTileUrl('village')],
    sourceLayer: 'village',
    geometry: 'circle',
    paint: {
      'circle-radius': 3,
      'circle-color': '#1e5ee9ff',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    },
    minzoom: 0,
    tileMaxZoom: 5,
    maxzoom: 22,
    labelConfig: { placement: 'point', field: 'Name' },
    interactive: true,
    click: { enabled: true }
  }
];

export const LAYERS = getLayers();

export const DEFAULT_LAYER_ORDER = [
  'contour20m',
  'contour50m',
  'major_stream',
  'minor_stream',
  'drainage_system',
  'ridge',
  'roadxvalley',
  'roadxridge',
  'village'
];

export const layerById = (id) => getLayers().find((l) => l.id === id);
