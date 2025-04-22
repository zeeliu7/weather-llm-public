import React, { useState, useEffect } from 'react';
import './Card.css'; // Shared CSS file for cards

const MoonPhase = ({ location, tempUnit, measurementSystem }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Replace with your actual API endpoint and key
        const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
        const response = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=${API_KEY}&q=${location.name}&dt=today`
        );
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const apiData = await response.json();
        setData(apiData);
      } catch (err) {
        console.error('Error fetching moon phase data:', err);
        setError('Failed to fetch moon phase data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchData();
    }
  }, [location]);

  // Helper function to get the appropriate moon emoji based on phase
  const getMoonPhaseEmoji = (phase) => {
    switch (phase.toLowerCase()) {
      case 'new moon':
        return '🌑';
      case 'waxing crescent':
        return '🌒';
      case 'first quarter':
        return '🌓';
      case 'waxing gibbous':
        return '🌔';
      case 'full moon':
        return '🌕';
      case 'waning gibbous':
        return '🌖';
      case 'last quarter':
        return '🌗';
      case 'waning crescent':
        return '🌘';
      default:
        return '🌙';
    }
  };

  // Helper function to get description text for the moon phase
  const getMoonPhaseDescription = (phase) => {
    switch (phase.toLowerCase()) {
      case 'new moon':
        return 'The moon is not visible from Earth.';
      case 'waxing crescent':
        return 'Less than half of the moon is visible and increasing.';
      case 'first quarter':
        return 'Half of the moon is visible and increasing.';
      case 'waxing gibbous':
        return 'More than half of the moon is visible and increasing.';
      case 'full moon':
        return 'The entire moon is visible.';
      case 'waning gibbous':
        return 'More than half of the moon is visible and decreasing.';
      case 'last quarter':
        return 'Half of the moon is visible and decreasing.';
      case 'waning crescent':
        return 'Less than half of the moon is visible and decreasing.';
      default:
        return 'Moon phase information unavailable.';
    }
  };

  if (loading) {
    return (
      <div className="card moon-phase-card loading">
        <div className="card-header">
          <h2>Moon Phase for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>Loading moon phase data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card moon-phase-card error">
        <div className="card-header">
          <h2>Moon Phase for {location.name}</h2>
        </div>
        <div className="card-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.astronomy || !data.astronomy.astro) {
    return (
      <div className="card moon-phase-card error">
        <div className="card-header">
          <h2>Moon Phase for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>No moon phase data available for this location.</p>
        </div>
      </div>
    );
  }

  const { moon_phase, moon_illumination } = data.astronomy.astro;
  
  return (
    <div className="card moon-phase-card">
      <div className="card-header">
        <h2>Moon Phase for {location.name}</h2>
        <p className="location-details">{data.location.region}, {data.location.country}</p>
        <p className="local-time">Local time: {data.location.localtime}</p>
      </div>
      <div className="card-content">
        <div className="moon-phase-status">
          <div className="moon-phase-icon">
            <span role="img" aria-label={moon_phase}>{getMoonPhaseEmoji(moon_phase)}</span>
          </div>
          <div className="moon-phase-info">
            <h3 className="phase-name">{moon_phase}</h3>
            <p className="phase-description">{getMoonPhaseDescription(moon_phase)}</p>
          </div>
        </div>
        <div className="moon-illumination">
          <span className="illumination-label">Illumination:</span>
          <span className="illumination-value">{moon_illumination}%</span>
          <div className="illumination-bar">
            <div 
              className="illumination-progress" 
              style={{ width: `${moon_illumination}%` }}
              aria-valuenow={moon_illumination}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoonPhase;