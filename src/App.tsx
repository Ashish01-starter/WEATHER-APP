import { useState, useEffect } from 'react';
import './App.css';
import IndiaMap from './components/IndiaMap';
import SidePanel from './components/SidePanel';
import Header from './components/Header';
import indiaDistrictsGeojson from './india-districts.json';
import { fetchDisasterData } from './services/api';
import type { StateMetrics } from './services/api';
import type { RiskLevel } from './services/riskCalculator';
import { calculateRiskLevels } from './services/riskCalculator';

export interface StateData {
  metrics: StateMetrics;
  riskStatus: RiskLevel;
}

function App() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [activeDistrictData, setActiveDistrictData] = useState<StateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stateStatusMap, setStateStatusMap] = useState<Record<string, RiskLevel>>({});
  const [districtStatusMap, setDistrictStatusMap] = useState<Record<string, RiskLevel>>({});

  // Simulate initial ambient risks for the map so the whole map isn't gray
  useEffect(() => {
    // We just generate some random initial risks for visual demo of the whole country map map
    const generateAmbientMap = () => {
      const statuses: Record<string, RiskLevel> = {};
      const allStates = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
      allStates.forEach(st => {
        const rand = Math.random();
        if (rand > 0.85) statuses[st] = 'critical';
        else if (rand > 0.6) statuses[st] = 'medium';
        else statuses[st] = 'safe';
      });
      setStateStatusMap(statuses);
    };
    generateAmbientMap();
  }, []);

  const handleStateSelect = (stateId: string) => {
    // Clicking the same state again zooms out
    if (selectedState === stateId) {
      setSelectedState(null);
      setSelectedDistrict(null);
    } else {
      setSelectedState(stateId);
      setSelectedDistrict(null);

      // Introduce the ambient colour system in the district view
      const statuses: Record<string, RiskLevel> = {};
      const normalizedState = stateId.toLowerCase().replace(/[^a-z0-9]/g, '').replace('islands', '');
      
      const districtFeatures = (indiaDistrictsGeojson as any).features.filter((f: any) => 
          f.properties.NAME_1 && f.properties.NAME_1.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedState)
      );

      districtFeatures.forEach((f: any) => {
         const rand = Math.random();
         const distName = f.properties.NAME_2;
         // Generate random initial status to show colorful districts right away
         if (rand > 0.85) statuses[distName] = 'critical';
         else if (rand > 0.6) statuses[distName] = 'medium';
         else statuses[distName] = 'safe';
      });

      setDistrictStatusMap(statuses);
    }
  };

  const handleDistrictSelect = async (districtId: string) => {
    setSelectedDistrict(districtId);
    setIsLoading(true);
    try {
      // Pass both districtName and stateName for more precise geolocation accuracy
      const data = await fetchDisasterData(districtId, selectedState!);
      const risk = calculateRiskLevels(data.temp, data.discharge, data.seismic);

      setActiveDistrictData({
        metrics: data,
        riskStatus: risk.overallStatus
      });

      // Update the map to show actual fetched risk for the specific district
      setDistrictStatusMap(prev => ({
        ...prev,
        [districtId]: risk.overallStatus
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <div className="map-section glass-panel">
          <IndiaMap
            onSelectState={handleStateSelect}
            onSelectDistrict={handleDistrictSelect}
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            stateStatusMap={stateStatusMap}
            districtStatusMap={districtStatusMap}
          />
        </div>

        <div className={`panel-section ${selectedState ? 'active' : ''}`}>
          {selectedDistrict ? (
            <SidePanel
              locationId={`${selectedDistrict}, ${selectedState}`}
              data={activeDistrictData}
              isLoading={isLoading}
              onClose={() => setSelectedDistrict(null)}
            />
          ) : selectedState ? (
            <div className="empty-panel glass-panel animate-fade-in">
              <div className="empty-state-content">
                <h2>{selectedState}</h2>
                <p>Select any district within {selectedState} to view real-time disaster alerts and analytics.</p>
              </div>
            </div>
          ) : (
            <div className="empty-panel glass-panel animate-fade-in">
              <div className="empty-state-content">
                <h2>Select a State</h2>
                <p>Click on any state on the map to view its districts and real-time disaster alerts.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
