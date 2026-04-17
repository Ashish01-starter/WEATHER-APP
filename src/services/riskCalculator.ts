export type RiskLevel = 'safe' | 'medium' | 'critical';

export interface AlertDetail {
    type: string;
    message: string;
    level: RiskLevel;
    precautions: string[];
}

export const calculateRiskLevels = (
    temp: number,
    discharge: number,
    seismic: number
): { overallStatus: RiskLevel; alerts: AlertDetail[] } => {
    const alerts: AlertDetail[] = [];
    let highestRisk: RiskLevel = 'safe';

    // Heatwave Logic (Tuned downwards to trigger more alerts)
    if (temp >= 38) {
        alerts.push({
            type: 'Heatwave',
            level: 'critical',
            message: `Severe heatwave warning. Temperatures reached ${temp.toFixed(1)}°C.`,
            precautions: [
                'Stay indoors during peak sunlight hours (12 PM - 4 PM).',
                'Drink plenty of fluids, even if not thirsty.',
                'Avoid strenuous outdoor activities.'
            ]
        });
        highestRisk = 'critical';
    } else if (temp >= 32) {
        alerts.push({
            type: 'High Heat',
            level: 'medium',
            message: `High temperatures detected (${temp.toFixed(1)}°C).`,
            precautions: [
                'Stay hydrated.',
                'Wear loose, light-colored clothing.'
            ]
        });
        if (highestRisk === 'safe') highestRisk = 'medium';
    }

    // Flood Logic (Tuned downwards)
    if (discharge >= 50) {
        alerts.push({
            type: 'Flood Alert',
            level: 'critical',
            message: `Critical river discharge rate: ${(discharge / 1000).toFixed(1)}k m³/s. High flood risk.`,
            precautions: [
                'Evacuate immediately if advised by local authorities.',
                'Move to higher ground.',
                'Do not walk or drive through flood waters.'
            ]
        });
        highestRisk = 'critical';
    } else if (discharge >= 10) {
        alerts.push({
            type: 'Rising Water',
            level: 'medium',
            message: `Elevated river discharge: ${discharge.toFixed(0)} m³/s. Monitor local updates.`,
            precautions: [
                'Monitor local weather and river updates.',
                'Prepare an emergency kit.'
            ]
        });
        if (highestRisk === 'safe') highestRisk = 'medium';
    }

    // Earthquake Logic
    if (seismic >= 3.0) {
        alerts.push({
            type: 'Earthquake Warning',
            level: 'critical',
            message: `Significant seismic activity detected: ${seismic.toFixed(1)} Magnitude.`,
            precautions: [
                'Drop, Cover, and Hold on!',
                'Stay away from windows and heavy furniture.',
                'If outdoors, move to an open area away from buildings and power lines.'
            ]
        });
        highestRisk = 'critical';
    } else if (seismic >= 1.5) {
        alerts.push({
            type: 'Moderate Earthquake',
            level: 'medium',
            message: `Moderate tremor detected (${seismic.toFixed(1)} Mag).`,
            precautions: [
                'Check for structural damage.',
                'Be prepared for aftershocks.'
            ]
        });
        if (highestRisk === 'safe') highestRisk = 'medium';
    }

    return {
        overallStatus: highestRisk,
        alerts
    };
};
