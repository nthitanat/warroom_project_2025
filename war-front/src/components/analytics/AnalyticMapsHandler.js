import { layerById } from './layers.registry';
import { removeLayerCompletely } from './layers.renderer';

const AnalyticMapsHandler = (stateAnalyticMaps, setAnalyticMaps, provinces, mapRef) => {
  const handleSearch = async () => {
    const value = stateAnalyticMaps.searchValue.trim();
    
    if (!value) {
      alert('Please enter a search term');
      return;
    }

    // Check if it's coordinates (lat, lng format)
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

    // First, try to find in local provinces data
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
      return;
    }

    // If not found in local data, use Nominatim geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(value)}` +
        `&format=json` +
        `&limit=1` +
        `&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WarRoom-Analytics-App'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const lngLat = [lng, lat];
        
        setAnalyticMaps('mapCenter', lngLat);
        mapRef.current?.flyTo({ 
          center: lngLat, 
          zoom: result.type === 'city' || result.type === 'town' ? 12 : 14 
        });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Search failed. Please check your connection and try again.');
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
