import React, { useState, useEffect } from 'react';
import './Card.css';

const Realtime = ({ location, tempUnit, measurementSystem }) => {
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
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${location.name}`
        );
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const apiData = await response.json();
        setData(apiData);
      } catch (err) {
        console.error('Error fetching current weather data:', err);
        setError('Failed to fetch current weather data. Please try again later.');
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
      <div className="card realtime-card loading">
        <div className="card-header">
          <h2>Current Weather for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>Loading current weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card realtime-card error">
        <div className="card-header">
          <h2>Current Weather for {location.name}</h2>
        </div>
        <div className="card-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.current) {
    return (
      <div className="card realtime-card error">
        <div className="card-header">
          <h2>Current Weather for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>No current weather data available for this location.</p>
        </div>
      </div>
    );
  }

  const { current, location: locationData } = data;
  
  // Get temperature and other measurements based on user preference
  const temp = tempUnit === 'Celsius' ? current.temp_c : current.temp_f;
  const feelsLike = tempUnit === 'Celsius' ? current.feelslike_c : current.feelslike_f;
  const windSpeed = measurementSystem === 'Metric' ? current.wind_kph : current.wind_mph;
  const windSpeedUnit = measurementSystem === 'Metric' ? 'km/h' : 'mph';
  const visibility = measurementSystem === 'Metric' ? current.vis_km : current.vis_miles;
  const visibilityUnit = measurementSystem === 'Metric' ? 'km' : 'miles';
  const precipitation = measurementSystem === 'Metric' ? current.precip_mm : current.precip_in;
  const precipitationUnit = measurementSystem === 'Metric' ? 'mm' : 'in';
  const pressure = measurementSystem === 'Metric' ? current.pressure_mb : current.pressure_in;
  const pressureUnit = measurementSystem === 'Metric' ? 'mb' : 'in';
  const gust = measurementSystem === 'Metric' ? current.gust_kph : current.gust_mph;
  const gustUnit = measurementSystem === 'Metric' ? 'km/h' : 'mph';
  
  return (
    <div className="card realtime-card">
      <div className="card-header">
        <h2>Current Weather for {locationData.name}</h2>
        <p className="location-details">{locationData.region}, {locationData.country}</p>
        <p className="local-time">Local time: {locationData.localtime}</p>
        <p className="last-updated">Last updated: {current.last_updated}</p>
      </div>
      <div className="card-content">
        <div className="realtime-main">
          <div className="realtime-condition">
            <img 
              src={current.condition.icon.replace('//', 'https://')} 
              alt={current.condition.text} 
              className="condition-icon-large" 
            />
            <div className="condition-details">
              <h3 className="condition-text">{current.condition.text}</h3>
              <p className="temp-value">{temp}°{tempUnit === 'Celsius' ? 'C' : 'F'}</p>
              <p className="feels-like">Feels like: {feelsLike}°{tempUnit === 'Celsius' ? 'C' : 'F'}</p>
            </div>
          </div>
        </div>

        <div className="realtime-details-grid">
          <div className="detail-item">
            <span className="detail-label">Wind:</span>
            <span className="detail-value">{windSpeed} {windSpeedUnit} {current.wind_dir}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Gust:</span>
            <span className="detail-value">{gust} {gustUnit}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Humidity:</span>
            <span className="detail-value">{current.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Cloud Cover:</span>
            <span className="detail-value">{current.cloud}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Visibility:</span>
            <span className="detail-value">{visibility} {visibilityUnit}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Precipitation:</span>
            <span className="detail-value">{precipitation} {precipitationUnit}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Pressure:</span>
            <span className="detail-value">{pressure} {pressureUnit}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">UV Index:</span>
            <span className="detail-value">{current.uv}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Realtime;