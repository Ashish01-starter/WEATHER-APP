import React from 'react';
import { AlertCircle, Waves, Activity, Loader2, X, ThermometerSun, BrainCircuit } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import type { StateData } from '../App';
import { calculateRiskLevels } from '../services/riskCalculator';
import { getGeminiInsights } from '../services/aiService';

interface SidePanelProps {
    locationId: string;
    data: StateData | null;
    isLoading: boolean;
    onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ locationId, data, isLoading, onClose }) => {
    if (isLoading || !data) {
        return (
            <div className="side-panel glass-panel animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin text-accent" size={48} />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Gathering live data for {locationId}...</p>
            </div>
        );
    }

    const { metrics, riskStatus } = data;

    // Local state for AI text
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Fetch AI insight when the panel opens or the stateId/data changes
    useEffect(() => {
        let isMounted = true;
        const fetchAI = async () => {
            setIsAiLoading(true);
            setAiInsight(null);
            try {
                const text = await getGeminiInsights(locationId, metrics.temp, metrics.discharge, metrics.seismic, riskStatus);
                if (isMounted) setAiInsight(text);
            } catch (e) {
                console.error("Failed to load AI Insights", e);
            } finally {
                if (isMounted) setIsAiLoading(false);
            }
        };

        if (metrics) {
            fetchAI();
        }

        return () => { isMounted = false; };
    }, [locationId, metrics, riskStatus]);

    // Need to evaluate precautions and alerts based on the real calculation.
    // We'll calculate it again here just for display purposes, though App.tsx has the status
    const { alerts } = calculateRiskLevels(metrics.temp, metrics.discharge, metrics.seismic);

    return (
        <div className="side-panel glass-panel animate-fade-in">
            <div className="panel-header">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <small style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px' }}>Active Location</small>
                    <h2 style={{ lineHeight: '1.2' }}>{locationId}</h2>
                </div>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>

            {alerts.length > 0 ? (
                alerts.map((alert: any, idx: number) => (
                    <div key={idx} className={`status-banner ${alert.level} animate-fade-in`}>
                        <h3>{alert.level === 'critical' ? <AlertCircle size={20} /> : null} {alert.type} Warning</h3>
                        <p>{alert.message}</p>
                    </div>
                ))
            ) : (
                <div className="status-banner safe animate-fade-in" style={{ borderLeftColor: 'var(--status-safe)' }}>
                    <h3>Status Normal</h3>
                    <p>All environmental metrics are within safe thresholds.</p>
                </div>
            )}

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header text-red">
                        <ThermometerSun size={20} />
                        <span>Temperature</span>
                    </div>
                    <div className="metric-value">{metrics.temp}°C</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header text-blue">
                        <Waves size={20} />
                        <span>River Discharge</span>
                    </div>
                    <div className="metric-value">{metrics.discharge} m³/s</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header text-yellow">
                        <Activity size={20} />
                        <span>Seismic Level</span>
                    </div>
                    <div className="metric-value">{metrics.seismic} M</div>
                </div>
            </div>

            <div className="charts-section" style={{ marginBottom: '1.5rem', paddingBottom: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <BrainCircuit color="var(--accent)" size={24} />
                    <h3 style={{ margin: 0 }}>Gemini AI Analysis</h3>
                </div>

                <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)'
                }}>
                    {isAiLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Loader2 className="animate-spin text-accent" size={20} />
                            <span style={{ color: 'var(--text-secondary)' }}>Analyzing current metrics...</span>
                        </div>
                    ) : (
                        <p>{aiInsight}</p>
                    )}
                </div>
            </div>

            <div className="charts-section">
                <h3>Live Activity Logs</h3>

                <div className="chart-container">
                    <h4>Temperature Trend</h4>
                    <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={metrics.timeseries}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="var(--text-secondary)" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }} />
                            <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h4>Discharge Trend (m³/s)</h4>
                    <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={metrics.timeseries}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }} />
                            <Line type="monotone" dataKey="discharge" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </div>

            <div className="precautions-section">
                <h3>Safety Precautions</h3>
                <ul>
                    {alerts.length > 0 ? (
                        alerts.flatMap((a: any) => a.precautions).map((prec: string, idx: number) => (
                            <li key={idx} className={riskStatus === 'critical' ? 'critical-li' : ''}>{prec}</li>
                        ))
                    ) : (
                        <li>No immediate precautions necessary. Stay informed with local updates.</li>
                    )}
                </ul>
            </div>

        </div>
    );
};

export default SidePanel;
