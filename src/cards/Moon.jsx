import React, { useState, useEffect } from 'react';
import './Card.css'; // Assuming you have a shared CSS file for cards

const Moon = ({ location, tempUnit, measurementSystem }) => {
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
        console.error('Error fetching moon data:', err);
        setError('Failed to fetch moon data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchData();
    }
  }, [location]);

  if (loading) {
    return (
      <div className="card moon-card loading">
        <div className="card-header">
          <h2>Moon information for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>Loading moon data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card moon-card error">
        <div className="card-header">
          <h2>Moon information for {location.name}</h2>
        </div>
        <div className="card-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.astronomy || !data.astronomy.astro) {
    return (
      <div className="card moon-card error">
        <div className="card-header">
          <h2>Moon information for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>No moon data available for this location.</p>
        </div>
      </div>
    );
  }

  const { moonrise, moonset, is_moon_up } = data.astronomy.astro;
  
  return (
    <div className="card moon-card">
      <div className="card-header">
        <h2>Moon information for {location.name}</h2>
        <p className="location-details">{data.location.region}, {data.location.country}</p>
        <p className="local-time">Local time: {data.location.localtime}</p>
      </div>
      <div className="card-content">
        <div className="moon-status">
          <div className="moon-icon">
            {is_moon_up === 1 ? (
              <span role="img" aria-label="Moon">🌙</span>
            ) : (
              <span role="img" aria-label="No Moon">🌑</span>
            )}
          </div>
          <p className="status-text">
            {is_moon_up === 1 ? "The moon is currently visible." : "The moon is currently not visible."}
          </p>
        </div>
        <div className="moon-times">
          <div className="time-item">
            <span className="time-label">Moonrise:</span>
            <span className="time-value">{moonrise}</span>
          </div>
          <div className="time-item">
            <span className="time-label">Moonset:</span>
            <span className="time-value">{moonset}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Moon;