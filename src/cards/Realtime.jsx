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
  
  // Helper function to safely access nested properties
  const safeGet = (obj, path, defaultValue = 'N/A') => {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : defaultValue;
    }, obj);
  };
  
  // Get temperature and other measurements based on user preference with safety checks
  const temp = tempUnit === 'Celsius' 
    ? safeGet(current, 'temp_c', 'N/A') 
    : safeGet(current, 'temp_f', 'N/A');
  
  const feelsLike = tempUnit === 'Celsius' 
    ? safeGet(current, 'feelslike_c', 'N/A') 
    : safeGet(current, 'feelslike_f', 'N/A');
  
  const windSpeed = measurementSystem === 'Metric' 
    ? safeGet(current, 'wind_kph', 'N/A') 
    : safeGet(current, 'wind_mph', 'N/A');
  
  const windSpeedUnit = measurementSystem === 'Metric' ? 'km/h' : 'mph';
  
  const visibility = measurementSystem === 'Metric' 
    ? safeGet(current, 'vis_km', 'N/A') 
    : safeGet(current, 'vis_miles', 'N/A');
  
  const visibilityUnit = measurementSystem === 'Metric' ? 'km' : 'miles';
  
  const precipitation = measurementSystem === 'Metric' 
    ? safeGet(current, 'precip_mm', 'N/A') 
    : safeGet(current, 'precip_in', 'N/A');
  
  const precipitationUnit = measurementSystem === 'Metric' ? 'mm' : 'in';
  
  const pressure = measurementSystem === 'Metric' 
    ? safeGet(current, 'pressure_mb', 'N/A') 
    : safeGet(current, 'pressure_in', 'N/A');
  
  const pressureUnit = measurementSystem === 'Metric' ? 'mb' : 'in';
  
  const gust = measurementSystem === 'Metric' 
    ? safeGet(current, 'gust_kph', 'N/A') 
    : safeGet(current, 'gust_mph', 'N/A');
  
  const gustUnit = measurementSystem === 'Metric' ? 'km/h' : 'mph';

  // Check if condition object exists before accessing its properties
  const conditionIcon = safeGet(current, 'condition.icon', '');
  const conditionText = safeGet(current, 'condition.text', 'Unknown');
  
  // Helper to render a detail item only if the value exists and is not 'N/A'
  const renderDetailItem = (label, value, unit = '') => {
    if (value !== 'N/A' && value !== undefined && value !== null) {
      return (
        <div className="detail-item">
          <span className="detail-label">{label}:</span>
          <span className="detail-value">{value} {unit}</span>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="card realtime-card">
      <div className="card-header">
        <h2>Current Weather for {safeGet(locationData, 'name', location.name)}</h2>
        {safeGet(locationData, 'region', false) && (
          <p className="location-details">
            {locationData.region}
            {safeGet(locationData, 'country', false) && `, ${locationData.country}`}
          </p>
        )}
        {safeGet(locationData, 'localtime', false) && (
          <p className="local-time">Local time: {locationData.localtime}</p>
        )}
        {safeGet(current, 'last_updated', false) && (
          <p className="last-updated">Last updated: {current.last_updated}</p>
        )}
      </div>
      <div className="card-content">
        <p className="api-notice">Due to API limits, some fields may not be available.</p>
        <div className="realtime-main">
          <div className="realtime-condition">
            {conditionIcon && (
              <img 
                src={conditionIcon.replace('//', 'https://')} 
                alt={conditionText} 
                className="condition-icon-large" 
              />
            )}
            <div className="condition-details">
              <h3 className="condition-text">{conditionText}</h3>
              {temp !== 'N/A' && (
                <p className="temp-value">{temp}°{tempUnit === 'Celsius' ? 'C' : 'F'}</p>
              )}
              {feelsLike !== 'N/A' && (
                <p className="feels-like">Feels like: {feelsLike}°{tempUnit === 'Celsius' ? 'C' : 'F'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="realtime-details-grid">
          {renderDetailItem('Wind', 
            windSpeed !== 'N/A' ? `${windSpeed} ${safeGet(current, 'wind_dir', '')}` : 'N/A', 
            windSpeedUnit
          )}
          {renderDetailItem('Gust', gust, gustUnit)}
          {renderDetailItem('Humidity', safeGet(current, 'humidity', 'N/A'), '%')}
          {renderDetailItem('Cloud Cover', safeGet(current, 'cloud', 'N/A'), '%')}
          {renderDetailItem('Visibility', visibility, visibilityUnit)}
          {renderDetailItem('Precipitation', precipitation, precipitationUnit)}
          {renderDetailItem('Pressure', pressure, pressureUnit)}
          {renderDetailItem('UV Index', safeGet(current, 'uv', 'N/A'))}
        </div>
      </div>
    </div>
  );
};

export default Realtime;