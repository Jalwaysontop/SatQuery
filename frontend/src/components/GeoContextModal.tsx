
import React, { useState } from 'react';
import {
  X,
  Globe,
  MapPin,
  Satellite,
  Check,
  Sparkles
} from 'lucide-react';
import { useQueryContext } from '../context/useQueryContext';
import { type GeoContext } from '../context/queryContextDef';

interface RegionPreset {
  name: string;
  country: string;
  desc: string;
  lat: number;
  lon: number;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

const regionPresets: RegionPreset[] = [
  {
    name: 'Ganges-Brahmaputra Delta',
    country: 'India & Bangladesh',
    desc: 'River braided dynamics, mangrove accretion, and coastal flooding',
    lat: 21.94,
    lon: 89.18,
    bbox: [88.0, 21.0, 90.5, 23.5],
  },
  {
    name: 'Amazon Rainforest Basin',
    country: 'Brazil',
    desc: 'Deforestation tracking, canopy moisture, and land-use conversion',
    lat: -3.46,
    lon: -62.21,
    bbox: [-65.0, -5.0, -60.0, -2.0],
  },
  {
    name: 'Indus River Agricultural Belt',
    country: 'India & Pakistan',
    desc: 'Crop health, canal irrigation extent, and post-monsoon flooding',
    lat: 29.35,
    lon: 71.69,
    bbox: [70.0, 28.0, 73.5, 31.0],
  },
  {
    name: 'Nile Delta & Mediterranean Coast',
    country: 'Egypt',
    desc: 'Urban expansion, coastal erosion, and salinity intrusion',
    lat: 31.05,
    lon: 31.23,
    bbox: [30.0, 30.5, 32.5, 31.8],
  },
  {
    name: 'Rhine River Basin',
    country: 'Germany / France',
    desc: 'Industrial waterway levels, drought indicators, and flood mitigation',
    lat: 50.11,
    lon: 8.68,
    bbox: [7.5, 48.5, 9.5, 51.5],
  },
  {
    name: 'California Central Valley',
    country: 'USA',
    desc: 'Groundwater depletion, crop fallowing, and wildfire burn scars',
    lat: 36.73,
    lon: -119.78,
    bbox: [-121.5, 35.0, -118.0, 38.5],
  },
];

const sensorOptions: { key: GeoContext['sensor']; label: string; desc: string; resolution: string }[] = [
  {
    key: 'auto',
    label: 'Auto-Detect (Agentic Selection)',
    desc: 'AI automatically selects optical, SAR, or multi-modal fusion based on query intent',
    resolution: 'Dynamic',
  },
  {
    key: 'sentinel2_optical',
    label: 'Sentinel-2 MSI (Optical & NIR)',
    desc: '13 spectral bands (Visible, Red-Edge, NIR, SWIR) for vegetation and urban change',
    resolution: '10m - 20m',
  },
  {
    key: 'sentinel1_sar',
    label: 'Sentinel-1 C-SAR (Radar)',
    desc: 'All-weather, day/night microwave backscatter (VV, VH) for water extent and surface roughness',
    resolution: '10m - 20m',
  },
  {
    key: 'fusion_optical_sar',
    label: 'Optical + SAR Cross-Modal Fusion',
    desc: 'Simultaneous joint-embedding inference for cloud-penetrating change detection',
    resolution: 'Co-registered 10m',
  },
  {
    key: 'landsat9',
    label: 'Landsat 8/9 OLI-2 / TIRS-2',
    desc: 'Thermal infrared and 30m multi-spectral archive for historical decadal comparisons',
    resolution: '30m / 100m Thermal',
  },
];



export const GeoContextModal: React.FC = () => {
  const { isGeoModalOpen, setIsGeoModalOpen, geoContext, setGeoContext } = useQueryContext();

  const [activeTab, setActiveTab] = useState<'region' | 'sensor'>('region');
  const [selectedRegion, setSelectedRegion] = useState<RegionPreset | null>(() => {
    return regionPresets.find((r) => r.name === geoContext.regionName) || null;
  });
  const [customLat, setCustomLat] = useState<string>(geoContext.coordinates ? String(geoContext.coordinates.lat) : '');
  const [customLon, setCustomLon] = useState<string>(geoContext.coordinates ? String(geoContext.coordinates.lon) : '');
  const [selectedSensor, setSelectedSensor] = useState<GeoContext['sensor']>(geoContext.sensor);

  if (!isGeoModalOpen) return null;

  const handleApply = () => {
    let finalRegionName = selectedRegion?.name || 'Custom Bounding Box';
    let country = selectedRegion?.country || 'User Defined';
    let bbox = selectedRegion?.bbox || null;
    let coordinates = selectedRegion
      ? { lat: selectedRegion.lat, lon: selectedRegion.lon }
      : customLat && customLon
      ? { lat: parseFloat(customLat), lon: parseFloat(customLon) }
      : undefined;

    if (!selectedRegion && (!customLat || !customLon)) {
      finalRegionName = 'Global / Auto-Detect';
      country = 'Worldwide';
    }

    setGeoContext({
      regionName: finalRegionName,
      country,
      bbox,
      coordinates,
      sensor: selectedSensor,
      language: 'en-US',
    });

    setIsGeoModalOpen(false);
  };

  const handleResetGlobal = () => {
    setSelectedRegion(null);
    setCustomLat('');
    setCustomLon('');
    setSelectedSensor('auto');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121826]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Geographic Targeting & Sensor Constellation
              </h3>
              <p className="text-xs text-gray-400">
                Configure regional ROI, satellite constellations, and query localization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGeoModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0d121c] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('region')}
            className={`
              flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer
              ${
                activeTab === 'region'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Region ROI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sensor')}
            className={`
              flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer
              ${
                activeTab === 'sensor'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite & Sensors</span>
          </button>


        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: REGION ROI */}
          {activeTab === 'region' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Featured Global Hotspots
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {regionPresets.map((preset) => {
                    const isSelected = selectedRegion?.name === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setSelectedRegion(preset);
                          setCustomLat(String(preset.lat));
                          setCustomLon(String(preset.lon));
                        }}
                        className={`
                          text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between
                          ${
                            isSelected
                              ? 'border-blue-500 bg-blue-600/15 text-white ring-1 ring-blue-500/50'
                              : 'bg-[#141a29]/70 border-slate-800 text-gray-300 hover:bg-[#182133] hover:border-slate-700'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <span>{preset.name}</span>
                            </div>
                            <div className="text-[11px] text-blue-300/80 font-medium mt-0.5">
                              {preset.country}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 line-clamp-2">{preset.desc}</p>
                        <div className="text-[9px] font-mono text-gray-400 mt-2">
                          {preset.lat.toFixed(2)}° N, {preset.lon.toFixed(2)}° E
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Lat/Lon Coordinates */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Or Specify Custom Coordinates (Lat, Lon)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Latitude (°N/°S)</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 21.9400"
                      value={customLat}
                      onChange={(e) => {
                        setCustomLat(e.target.value);
                        setSelectedRegion(null);
                      }}
                      className="w-full bg-[#141a29] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Longitude (°E/°W)</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 89.1800"
                      value={customLon}
                      onChange={(e) => {
                        setCustomLon(e.target.value);
                        setSelectedRegion(null);
                      }}
                      className="w-full bg-[#141a29] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SENSORS & CONSTELLATIONS */}
          {activeTab === 'sensor' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Select Constellation / Modality Mode
              </label>
              <div className="space-y-2">
                {sensorOptions.map((sensor) => {
                  const isSelected = selectedSensor === sensor.key;
                  return (
                    <button
                      key={sensor.key}
                      type="button"
                      onClick={() => setSelectedSensor(sensor.key)}
                      className={`
                        w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-start justify-between
                        ${
                          isSelected
                            ? 'border-blue-500 bg-blue-600/15 text-white ring-1 ring-blue-500/50'
                            : 'bg-[#141a29]/70 border-slate-800 text-gray-300 hover:bg-[#182133] hover:border-slate-700'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2.5">
                        <Satellite className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">{sensor.label}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{sensor.desc}</div>
                          <div className="text-[10px] text-blue-300 font-mono mt-1">
                            Native Resolution: {sensor.resolution}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}



        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#121826]">
          <button
            type="button"
            onClick={handleResetGlobal}
            className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Reset to Global Default
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply Targeting Context</span>
          </button>
        </div>

      </div>
    </div>
  );
};
