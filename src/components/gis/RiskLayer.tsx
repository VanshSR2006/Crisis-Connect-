import React, { useMemo } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { useOfficerContext, LiveRiskZone } from '@/lib/officerContext';
import L, { PathOptions } from 'leaflet';
import { SeverityLevel } from '@/types';

interface RiskLayerProps {
  isVisible: boolean;
}

export const RiskLayer: React.FC<RiskLayerProps> = ({ isVisible }) => {
  const { riskZones, selectedZoneId, setSelectedZoneId } = useOfficerContext();
  const map = useMap();

  const getStyleForLevel = (level: SeverityLevel, isSelected: boolean): PathOptions => {
    let color = '#15803d'; // low (green)
    let fillColor = '#15803d';

    if (level === 'critical') {
      color = '#ba1a1a';
      fillColor = '#ef4444';
    } else if (level === 'high') {
      color = '#c2410c';
      fillColor = '#f97316';
    } else if (level === 'medium') {
      color = '#f59e0b';
      fillColor = '#fbbf24';
    }

    return {
      color,
      fillColor,
      weight: isSelected ? 3 : 1,
      opacity: isSelected ? 1 : 0.6,
      fillOpacity: isSelected ? 0.4 : 0.2,
      dashArray: isSelected ? undefined : '4',
    };
  };

  const parsedFeatures = useMemo(() => {
    return riskZones
      .filter(zone => zone.boundary_json)
      .map(zone => {
        try {
          const feature = JSON.parse(zone.boundary_json!);
          return { zone, feature };
        } catch (e) {
          console.warn(`Invalid geometry for zone ${zone.zone_id}`);
          return null;
        }
      })
      .filter(Boolean) as { zone: LiveRiskZone; feature: any }[];
  }, [riskZones]);

  if (!isVisible) return null;

  return (
    <>
      {parsedFeatures.map(({ zone, feature }) => {
        const isSelected = selectedZoneId === zone.zone_id;
        return (
          <GeoJSON
            key={`${zone.id}-${isSelected}`} // re-render when selected state changes for z-index/style updates
            data={feature}
            style={getStyleForLevel(zone.risk_level, isSelected)}
            onEachFeature={(_, layer) => {
              layer.on({
                click: () => {
                  setSelectedZoneId(zone.zone_id);
                },
                mouseover: (e) => {
                  if (!isSelected) {
                    const l = e.target;
                    l.setStyle({ fillOpacity: 0.35, weight: 2 });
                  }
                },
                mouseout: (e) => {
                  if (!isSelected) {
                    const l = e.target;
                    l.setStyle(getStyleForLevel(zone.risk_level, false));
                  }
                }
              });
              
              if (isSelected && layer instanceof L.Polygon) {
                layer.bringToFront();
                // Ensure incident markers stay above everything
                // This is automatically handled by Leaflet panes (markerPane vs overlayPane)
              }
            }}
          />
        );
      })}
    </>
  );
};
