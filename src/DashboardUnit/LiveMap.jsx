import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16); 
  }, [lat, lng, map]);
  return null;
}

const LiveMap = () => {
  const [coords, setCoords] = useState({ lat: 30.5965, lng: 32.2715 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCoords(prev => ({
        lat: prev.lat + 0.0005, 
        lng: prev.lng + 0.0005
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[450px] w-full rounded-2xl shadow-2xl border-4 border-white overflow-hidden">
      <MapContainer center={[coords.lat, coords.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[coords.lat, coords.lng]} />
        <Recenter lat={coords.lat} lng={coords.lng} />
      </MapContainer>
    </div>
  );
};

export default LiveMap;