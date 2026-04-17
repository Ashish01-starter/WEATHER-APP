import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header className="app-header glass-panel">
            <div className="header-content">
                <div className="logo-section">
                    <ShieldAlert className="logo-icon" size={32} color="var(--accent)" />
                    <div>
                        <h1>INDIA DISASTER INDEX</h1>
                        <p className="subtitle">Real-Time Natural Calamity Monitoring System</p>
                    </div>
                </div>
                <div className="status-legend">
                    <div className="legend-item">
                        <span className="legend-color safe"></span>
                        <span>Normal</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color medium"></span>
                        <span>Medium Risk</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color critical"></span>
                        <span>Critical Alert</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
