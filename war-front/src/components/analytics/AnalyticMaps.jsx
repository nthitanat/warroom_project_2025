import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';

import {
  LAYERS,
  DEFAULT_LAYER_ORDER,
  layerById
} from './layers.registry';
import {
  syncOneLayer,
  removeLayerCompletely,
  layerId,
  labelLayerId
} from './layers.renderer';
import useAnalyticMaps from './useAnalyticMaps';
import AnalyticMapsHandler from './AnalyticMapsHandler';
import styles from './AnalyticMaps.module.scss';

const STYLES = {
  street: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`,
  satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`
};

const DEFAULT_ZOOM = 5.3;
const VILLAGE_LABEL_MIN_ZOOM = 9;

export default function AnalyticMaps({ provinces }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const { stateAnalyticMaps, setAnalyticMaps } = useAnalyticMaps(provinces);
  const handlers = AnalyticMapsHandler(stateAnalyticMaps, setAnalyticMaps, provinces, mapRef);

  const availableLayers = useMemo(
    () => DEFAULT_LAYER_ORDER.filter((id) => !stateAnalyticMaps.orderedLayers.includes(id)),
    [stateAnalyticMaps.orderedLayers]
  );

  useEffect(() => {
    setAnalyticMaps('isMounted', true);
    setAnalyticMaps('activeLayers', 
      Object.fromEntries(DEFAULT_LAYER_ORDER.map((id) => [id, false]))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleBookVillage = (e) => {
      const village = e.detail;
      console.log('Book village:', village);
    };

    window.addEventListener('book-village', handleBookVillage);
    return () => {
      window.removeEventListener('book-village', handleBookVillage);
    };
  }, []);

  useEffect(() => {
    if (!stateAnalyticMaps.isMounted || !mapContainerRef.current) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {}
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLES[stateAnalyticMaps.mapStyle],
      center: stateAnalyticMaps.mapCenter,
      zoom: DEFAULT_ZOOM
    });

    mapRef.current = map;

    map.on('load', () => {
      syncLayers();

      const applyVillageLabelVisibility = () => {
        const zoom = map.getZoom();
        const layers = LAYERS;
        const villageSpec = layers.find((l) => l.id === 'village');
        if (!villageSpec) return;
        const lblId = labelLayerId(villageSpec);
        if (map.getLayer(lblId)) {
          map.setLayoutProperty(
            lblId,
            'visibility',
            zoom < VILLAGE_LABEL_MIN_ZOOM ? 'none' : 'visible'
          );
        }
      };

      applyVillageLabelVisibility();
      map.on('zoom', applyVillageLabelVisibility);
    });

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateAnalyticMaps.isMounted, stateAnalyticMaps.mapStyle]);

  const syncLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const drawOrder = [...stateAnalyticMaps.orderedLayers].reverse();

    LAYERS.forEach((spec) => {
      const shouldBeActive =
        !!stateAnalyticMaps.activeLayers[spec.id] && stateAnalyticMaps.orderedLayers.includes(spec.id);
      if (!shouldBeActive) {
        removeLayerCompletely(map, spec);
        return;
      }

      syncOneLayer(map, spec);

      if (spec.id === 'village') {
        const zoom = map.getZoom();
        const lblId = labelLayerId(spec);
        if (map.getLayer(lblId)) {
          map.setLayoutProperty(
            lblId,
            'visibility',
            zoom < VILLAGE_LABEL_MIN_ZOOM ? 'none' : 'visible'
          );
        }
      }
    });

    drawOrder.forEach((id, idx) => {
      const spec = layerById(id);
      if (!spec) return;
      const base = layerId(spec);
      const beforeBase = drawOrder[idx - 1]
        ? layerId(layerById(drawOrder[idx - 1]))
        : undefined;
      try {
        if (map.getLayer(base)) {
          beforeBase
            ? map.moveLayer(base, beforeBase)
            : map.moveLayer(base);
        }
        const lbl = labelLayerId(spec);
        if (map.getLayer(lbl)) {
          map.moveLayer(lbl);
        }
      } catch {}
    });
  }, [stateAnalyticMaps.activeLayers, stateAnalyticMaps.orderedLayers]);

  useEffect(() => {
    syncLayers();
  }, [syncLayers]);

  if (!stateAnalyticMaps.isMounted) return null;

  return (
    <div className={styles.Container}>
      <style>{`
        .maplibregl-popup .book-btn {
          background: var(--primary-500);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          margin-top: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .maplibregl-popup .book-btn:hover {
          background: var(--primary-700);
        }
      `}</style>

      <div className={styles.SearchWrapper}>
        <input
          type="text"
          className={styles.SearchInput}
          placeholder='Search for a province or "lat, lng"'
          value={stateAnalyticMaps.searchValue}
          onChange={(e) => setAnalyticMaps('searchValue', e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handlers.handleSearch()}
        />
        <button onClick={handlers.handleSearch} className={styles.SearchButton}>
          Search
        </button>
      </div>

      <div className={styles.MapWrapper}>
        <div ref={mapContainerRef} className={styles.MapContainer} />

        <div className={styles.MapStyleToggle}>
          <button
            className={`${styles.ToggleButton} ${stateAnalyticMaps.mapStyle === 'street' ? styles.Active : ''}`}
            onClick={() => setAnalyticMaps('mapStyle', 'street')}
          >
            StreetMap
          </button>
          <button
            className={`${styles.ToggleButton} ${stateAnalyticMaps.mapStyle === 'satellite' ? styles.Active : ''}`}
            onClick={() => setAnalyticMaps('mapStyle', 'satellite')}
          >
            Satellite
          </button>
        </div>
      </div>

      <div className={styles.LayersPanel}>
        <div className={styles.LayerSection}>
          <strong>Available Layers</strong>
          <div className={styles.LayerList}>
            {availableLayers.map((id) => {
              const spec = layerById(id);
              return (
                <div key={id} className={styles.LayerItem}>
                  <span>{spec.title}</span>
                  <button
                    className={styles.AddButton}
                    onClick={() => handlers.handleAddLayer(id)}
                  >
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.LayerSection}>
          <strong>Active Layers</strong>
          <DragDropContext onDragEnd={handlers.onDragEnd}>
            <Droppable droppableId="layers-droppable">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className={styles.LayerList}>
                  {stateAnalyticMaps.orderedLayers.map((id, index) => {
                    const spec = layerById(id);
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(drag) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={styles.ActiveLayerItem}
                          >
                            <span>{spec.title}</span>
                            <div className={styles.LayerControls}>
                              <label className={styles.CheckboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={!!stateAnalyticMaps.activeLayers[id]}
                                  onChange={() => handlers.handleToggleVisibility(id)}
                                />
                                <span>Visible</span>
                              </label>
                              <button
                                className={styles.RemoveButton}
                                onClick={() => handlers.handleRemoveLayer(id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
