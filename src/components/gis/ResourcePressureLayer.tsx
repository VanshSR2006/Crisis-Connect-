import React, { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { useOfficerContext, ZoneResourcePressure } from '@/lib/officerContext';
import { PathOptions } from 'leaflet';

interface ResourcePressureLayerProps {
  isVisible: boolean;
}

/**
 * Pressure status colors — deliberately distinct from the Risk layer.
 * Risk uses red/orange/amber/green.
 * Pressure uses blue/purple/indigo palette.
 */
function getPressureStyle(
  status: ZoneResourcePressure['overallStatus'],
  isSelected: boolean
): PathOptions {
  let color = '#6b7280';    // unknown — gray
  let fillColor = '#9ca3af';

  switch (status) {
    case 'adequate':
      color = '#1d4ed8';
      fillColor = '#3b82f6';
      break;
    case 'under_pressure':
      color = '#7c3aed';
      fillColor = '#a855f7';
      break;
    case 'critical':
      color = '#1e1b4b';
      fillColor = '#4f46e5';
      break;
  }

  return {
    color,
    fillColor,
    weight: isSelected ? 3 : 1.5,
    opacity: isSelected ? 1 : 0.7,
    fillOpacity: isSelected ? 0.45 : 0.22,
    dashArray: '6 4', // dashed boundary — visually distinct from risk solid polygons
  };
}

export const ResourcePressureLayer: React.FC<ResourcePressureLayerProps> = ({ isVisible }) => {
  const { zonePressure, selectedZoneId, setSelectedZoneId } = useOfficerContext();

  const parsedFeatures = useMemo(() => {
    return zonePressure
      .filter(zone => zone.boundary_json)
      .map(zone => {
        try {
          const feature = JSON.parse(zone.boundary_json!);
          return { zone, feature };
        } catch {
          if (import.meta.env.DEV) {
            console.warn(`[ResourcePressureLayer] Invalid geometry for zone ${zone.zone_id}`);
          }
          return null;
        }
      })
      .filter(Boolean) as { zone: ZoneResourcePressure; feature: unknown }[];
  }, [zonePressure]);

  if (!isVisible) return null;

  return (
    <>
      {parsedFeatures.map(({ zone, feature }) => {
        const isSelected = selectedZoneId === zone.zone_id;
        return (
          <GeoJSON
            key={`rp-${zone.zone_id}-${isSelected}`}
            data={feature as any}
            style={getPressureStyle(zone.overallStatus, isSelected)}
            onEachFeature={(_, layer) => {
              layer.on({
                click: () => {
                  setSelectedZoneId(isSelected ? null : zone.zone_id);
                },
                mouseover: (e) => {
                  if (!isSelected) {
                    e.target.setStyle({ fillOpacity: 0.4, weight: 2 });
                  }
                },
                mouseout: (e) => {
                  if (!isSelected) {
                    e.target.setStyle(getPressureStyle(zone.overallStatus, false));
                  }
                },
              });
            }}
          />
        );
      })}
    </>
  );
};
