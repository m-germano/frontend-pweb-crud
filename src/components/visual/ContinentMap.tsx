import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'

type Props = {
  name: string // ex.: "América do Sul", "Europa"
  height?: number
}

function boundsForContinent(name: string): LatLngBoundsExpression | null {
  // Bounding boxes aproximadas (lat, lon)
  // Fonte: aproximações usuais por continente (p/ visualização rápida)
  const n = name.toLowerCase()
  if (n.includes('américa do sul') || n.includes('south america')) {
    return [[-56, -82], [13, -34]]
  }
  if (n.includes('américa do norte') || n.includes('north america')) {
    return [[7, -168], [83, -52]]
  }
  if (n.includes('europa') || n.includes('europe')) {
    return [[34, -25], [72, 45]]
  }
  if (n.includes('áfrica') || n.includes('africa')) {
    return [[-36, -18], [38, 52]]
  }
  if (n.includes('ásia') || n.includes('asia')) {
    return [[1, 26], [77, 170]]
  }
  if (n.includes('oceania') || n.includes('australia') || n.includes('australásia')) {
    return [[-50, 110], [0, 180]]
  }
  if (n.includes('antártica') || n.includes('antarctica')) {
    return [[-90, -180], [-60, 180]]
  }
  return null
}

export default function ContinentMap({ name, height = 200 }: Props) {
  const bounds = boundsForContinent(name)

  return (
    <div style={{ height }}>
      <MapContainer
        bounds={bounds || [[-10, -10], [10, 10]]}
        style={{ height: '100%', width: '100%', borderRadius: 8 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && (
          <Rectangle
            bounds={bounds}
            pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.08 }}
          />
        )}
      </MapContainer>
    </div>
  )
}
