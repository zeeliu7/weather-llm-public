import React, { useState, useEffect } from 'react';
import './Card.css'; // Assuming you have a shared CSS file for cards

const Sun = ({ location, tempUnit, measurementSystem }) => {
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
        console.error('Error fetching sun data:', err);
        setError('Failed to fetch sun data. Please try again later.');
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
      <div className="card sun-card loading">
        <div className="card-header">
          <h2>Sun information for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>Loading sun data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card sun-card error">
        <div className="card-header">
          <h2>Sun information for {location.name}</h2>
        </div>
        <div className="card-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.astronomy || !data.astronomy.astro) {
    return (
      <div className="card sun-card error">
        <div className="card-header">
          <h2>Sun information for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>No sun data available for this location.</p>
        </div>
      </div>
    );
  }

  const { sunrise, sunset, is_sun_up } = data.astronomy.astro;
  
  return (
    <div className="card sun-card">
      <div className="card-header">
        <h2>Sun information for {location.name}</h2>
        <p className="location-details">{data.location.region}, {data.location.country}</p>
        <p className="local-time">Local time: {data.location.localtime}</p>
      </div>
      <div className="card-content">
        <div className="sun-status">
          <div className="sun-icon">
            {is_sun_up === 1 ? (
              <span role="img" aria-label="Sun">☀️</span>
            ) : (
              <span role="img" aria-label="Moon">🌙</span>
            )}
          </div>
          <p className="status-text">
            {is_sun_up === 1 ? "The sun is currently up." : "The sun is currently down."}
          </p>
        </div>
        <div className="sun-times">
          <div className="time-item">
            <span className="time-label">Sunrise:</span>
            <span className="time-value">{sunrise}</span>
          </div>
          <div className="time-item">
            <span className="time-label">Sunset:</span>
            <span className="time-value">{sunset}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sun;