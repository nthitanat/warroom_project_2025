import { layerById } from './layers.registry';
import { removeLayerCompletely } from './layers.renderer';

const AnalyticMapsHandler = (stateAnalyticMaps, setAnalyticMaps, provinces, mapRef) => {
  const handleSearch = () => {
    const value = stateAnalyticMaps.searchValue.trim();
    const coordMatch = value.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    );
    
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      const lngLat = [lng, lat];
      setAnalyticMaps('mapCenter', lngLat);
      mapRef.current?.flyTo({ center: lngLat, zoom: 14 });
      return;
    }

    const found = provinces.find(
      (p) =>
        p.name?.toLowerCase() === value.toLowerCase() ||
        p.thai_name === value
    );

    if (found && Array.isArray(found.coordinates)) {
      const [lat, lng] = found.coordinates;
      const lngLat = [lng, lat];
      setAnalyticMaps('mapCenter', lngLat);
      mapRef.current?.flyTo({ center: lngLat, zoom: 10 });
    } else {
      alert('Province not found!');
    }
  };

  const handleToggleVisibility = (id) => {
    setAnalyticMaps('activeLayers', {
      ...stateAnalyticMaps.activeLayers,
      [id]: !stateAnalyticMaps.activeLayers[id]
    });
  };

  const handleRemoveLayer = (id) => {
    setAnalyticMaps('orderedLayers', 
      stateAnalyticMaps.orderedLayers.filter((l) => l !== id)
    );
    setAnalyticMaps('activeLayers', {
      ...stateAnalyticMaps.activeLayers,
      [id]: false
    });

    const map = mapRef.current;
    if (!map) return;
    const spec = layerById(id);
    if (!spec) return;
    removeLayerCompletely(map, spec);
  };

  const handleAddLayer = (id) => {
    setAnalyticMaps('orderedLayers', [...stateAnalyticMaps.orderedLayers, id]);
    setAnalyticMaps('activeLayers', {
      ...stateAnalyticMaps.activeLayers,
      [id]: true
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updated = Array.from(stateAnalyticMaps.orderedLayers);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setAnalyticMaps('orderedLayers', updated);
  };

  return {
    handleSearch,
    handleToggleVisibility,
    handleRemoveLayer,
    handleAddLayer,
    onDragEnd,
  };
};

export default AnalyticMapsHandler;
