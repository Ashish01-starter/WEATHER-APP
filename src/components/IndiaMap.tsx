import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import indiaTopoJson from '../india.topo.json';
import indiaDistrictsGeojson from '../india-districts.json';

interface IndiaMapProps {
    onSelectState: (stateId: string) => void;
    onSelectDistrict: (districtId: string) => void;
    selectedState: string | null;
    selectedDistrict: string | null;
    stateStatusMap: Record<string, string>;
    districtStatusMap: Record<string, string>;
}

const normalizeString = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const IndiaMap: React.FC<IndiaMapProps> = ({ 
    onSelectState, 
    onSelectDistrict, 
    selectedState, 
    selectedDistrict, 
    stateStatusMap,
    districtStatusMap
}) => {
    
    const getStatusColor = (status?: string) => {
        if (status === 'critical') return 'var(--status-critical)';
        if (status === 'medium') return 'var(--status-medium)';
        if (status === 'safe') return 'var(--status-safe)';
        return 'var(--status-safe)'; // Default fallback
    };

    // Filter districts based on selected state loosely to account for naming differences
    const targetDistricts = useMemo(() => {
        if (!selectedState) return null;
        const normalizedState = normalizeString(selectedState);
        return {
            ...indiaDistrictsGeojson,
            features: (indiaDistrictsGeojson as any).features.filter((f: any) => 
                f.properties.NAME_1 && normalizeString(f.properties.NAME_1).includes(normalizedState.replace('islands', ''))
            )
        };
    }, [selectedState]);

    return (
        <div className="map-container" style={{ position: 'relative' }}>
            {selectedState && (
                <button 
                    onClick={() => onSelectState(selectedState)} 
                    style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
                    className="close-btn"
                >
                    &larr; Back to National View
                </button>
            )}

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 1000,
                    center: [80, 22] // Centered on India
                }}
                width={800}
                height={600}
                style={{ width: "100%", height: "100%" }}
            >
                {/* Level 1: State map - rendered partially transparent if a state is selected */}
                <Geographies geography={indiaTopoJson}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const isSelected = selectedState === geo.properties.name;
                            const isAnotherStateSelected = selectedState && !isSelected;
                            const statusColor = getStatusColor(stateStatusMap[geo.properties.name]);

                            // If a state is selected, hide the state polygon of the selected state so its districts show through,
                            // or keep it but make it transparent. Actually, we completely hide the selected state to show districts
                            if (isSelected) return null;

                            return (
                                <Geography
                                    key={`state-${geo.rsmKey}`}
                                    geography={geo}
                                    onClick={() => {
                                        if (isAnotherStateSelected) return; // Prevent clicking another state while viewing districts
                                        onSelectState(geo.properties.name || geo.id);
                                    }}
                                    style={{
                                        default: {
                                            fill: isAnotherStateSelected ? "#2a2d3e" : statusColor,
                                            stroke: "var(--bg-primary)",
                                            strokeWidth: 0.75,
                                            outline: "none",
                                            transition: "all 0.3s ease",
                                            opacity: isAnotherStateSelected ? 0.3 : 0.85
                                        },
                                        hover: {
                                            fill: isAnotherStateSelected ? "#2a2d3e" : statusColor,
                                            stroke: "white",
                                            strokeWidth: isAnotherStateSelected ? 0.75 : 1.5,
                                            outline: "none",
                                            cursor: isAnotherStateSelected ? "default" : "pointer",
                                            opacity: isAnotherStateSelected ? 0.3 : 1,
                                            transform: isAnotherStateSelected ? "none" : "translateY(-2px)"
                                        },
                                        pressed: {
                                            fill: isAnotherStateSelected ? "#2a2d3e" : "var(--accent)",
                                            outline: "none",
                                        },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>

                {/* Level 2: District Map (only renders if a state is selected) */}
                {selectedState && targetDistricts && (
                    <Geographies geography={targetDistricts}>
                       {({ geographies }) =>
                           geographies.map((geo) => {
                               const distName = geo.properties.NAME_2;
                               const isSelected = selectedDistrict === distName;
                               // Use district map status if available, fallback to some ambient safe color
                               const alertStatus = districtStatusMap[distName] || "safe";
                               const statusColor = getStatusColor(alertStatus);

                               return (
                                   <Geography
                                       key={`dist-${geo.rsmKey}`}
                                       geography={geo}
                                       onClick={() => {
                                           onSelectDistrict(distName);
                                       }}
                                       style={{
                                            default: {
                                                fill: statusColor,
                                                stroke: "var(--bg-primary)",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                opacity: 0.9
                                            },
                                            hover: {
                                                fill: statusColor,
                                                stroke: "white",
                                                strokeWidth: 1.2,
                                                outline: "none",
                                                cursor: "pointer",
                                                opacity: 1
                                            },
                                            pressed: {
                                                fill: "var(--accent)",
                                                outline: "none",
                                            },
                                       }}
                                       className={isSelected ? "selected-state" : "district-state"}
                                   />
                               );
                           })
                       }
                    </Geographies>
                )}
            </ComposableMap>
        </div>
    );
};

export default IndiaMap;
