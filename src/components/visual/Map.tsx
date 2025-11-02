import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMemo, useEffect } from 'react';
import { MapPin } from 'lucide-react'; 
import ReactDOMServer from 'react-dom/server';

type Props = {
  lat: number;
  lon: number;
  zoom?: number;
  label?: string;
  height?: number;
  className?: string;
};

// Componente para ajustar a visualização quando a posição muda
function MapController({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lon], zoom, {
      animate: true,
      duration: 1
    });
  }, [map, lat, lon, zoom]);

  return null;
}

export default function Map({ lat, lon, zoom = 12, label, height = 280, className = '' }: Props) {
  // Validar coordenadas
  const isValidCoords = useMemo(() => 
    !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180,
    [lat, lon]
  );

  const center = useMemo<[number, number]>(() => [lat, lon], [lat, lon]);

  // Ícone moderno com SVG
  const iconSvg = ReactDOMServer.renderToString(
    <div className="relative">
      <MapPin size={32} className="text-red-500 fill-red-500 drop-shadow-lg" />
      <div className="absolute inset-0 animate-ping">
        <MapPin size={32} className="text-red-400/30 fill-red-400/30" />
      </div>
    </div>
  );

  const customIcon = new L.DivIcon({
    html: iconSvg,
    className: 'bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  if (!isValidCoords) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground p-4">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Coordenadas inválidas</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-lg overflow-hidden border shadow-sm ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ 
          height: '100%', 
          width: '100%',
          filter: 'saturate(1.1) contrast(1.05)'
        }}
        zoomControl={true}
        scrollWheelZoom={false}
        className="city-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Alternativa mais suave: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={center} icon={customIcon}>
          {label && (
            <Popup className="custom-popup">
              <div className="text-sm font-medium">
                <MapPin className="h-3 w-3 inline mr-1" />
                {label}
              </div>
            </Popup>
          )}
        </Marker>
        <MapController lat={lat} lon={lon} zoom={zoom} />
      </MapContainer>
      
      {/* Overlay de gradiente para melhor contraste */}
      <div className="absolute inset-0 pointer-events-none rounded-lg border border-border/50" />
      
      {/* Controles customizados */}
      <style>{`
        .city-map .leaflet-control-zoom {
          border: none !important;
          margin: 8px !important;
        }
        .city-map .leaflet-control-zoom a {
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 6px !important;
        }
        .city-map .leaflet-control-zoom a:hover {
          background: hsl(var(--accent)) !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
        }
        .custom-popup .leaflet-popup-tip {
          background: hsl(var(--background));
        }
      `}</style>
    </div>
  );
}