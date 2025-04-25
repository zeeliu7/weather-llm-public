import React, { useState, useEffect } from 'react';
import './Card.css';

const DAY_IN_SECONDS = 86400;

const Forecast = ({ location, tempUnit, measurementSystem, normalizedPeriod }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate days for forecast (min 2, max 7)
        const daysForForecast = Math.max(2, Math.min(7, Math.ceil(normalizedPeriod / DAY_IN_SECONDS)));
        setDays(daysForForecast);
        
        // Replace with your actual API endpoint and key
        const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location.name}&days=${daysForForecast}`
        );
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const apiData = await response.json();
        setData(apiData);
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError('Failed to fetch forecast data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (location && normalizedPeriod) {
      fetchData();
    }
  }, [location, normalizedPeriod]);

  if (loading) {
    return (
      <div className="card forecast-card loading">
        <div className="card-header">
          <h2>{days}-day Forecast for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card forecast-card error">
        <div className="card-header">
          <h2>Forecast for {location.name}</h2>
        </div>
        <div className="card-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.forecast || !data.forecast.forecastday) {
    return (
      <div className="card forecast-card error">
        <div className="card-header">
          <h2>Forecast for {location.name}</h2>
        </div>
        <div className="card-content">
          <p>No forecast data available for this location.</p>
        </div>
      </div>
    );
  }

  // Function to get the temperature based on user preference
  const getTemperature = (forecastDay) => {
    if (tempUnit === 'Celsius') {
      return {
        max: forecastDay.day.maxtemp_c,
        min: forecastDay.day.mintemp_c,
        unit: '°C'
      };
    } else {
      return {
        max: forecastDay.day.maxtemp_f,
        min: forecastDay.day.mintemp_f,
        unit: '°F'
      };
    }
  };
  
  // Function to get wind speed based on measurement system
  const getWindSpeed = (forecastDay) => {
    if (measurementSystem === 'Imperial') {
      return {
        speed: forecastDay.day.maxwind_mph,
        unit: 'mph'
      };
    } else {
      return {
        speed: forecastDay.day.maxwind_kph,
        unit: 'km/h'
      };
    }
  };
  
  // Format date from YYYY-MM-DD to more readable format
  const formatDate = (dateString) => {
    // Split the date string to get year, month, day
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    
    // Create date object with explicit values (month is 0-indexed in JavaScript)
    // Important: use local date construction to avoid timezone issues
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="card forecast-card">
      <div className="card-header">
        <h2>{days}-day Forecast for {location.name}</h2>
        <p className="location-details">
          {data.location.region ? `${data.location.region}, ` : ''}{data.location.country}
        </p>
        <p className="local-time">Local time: {data.location.localtime}</p>
      </div>
      <div className="card-content">
        <div className="forecast-days">
          {data.forecast.forecastday.map((forecastDay) => {
            const temp = getTemperature(forecastDay);
            const wind = getWindSpeed(forecastDay);
            return (
              <div key={forecastDay.date} className="forecast-day">
                <div className="forecast-date">{formatDate(forecastDay.date)}</div>
                <div className="forecast-condition">
                  <img 
                    src={forecastDay.day.condition.icon} 
                    alt={forecastDay.day.condition.text}
                    className="condition-icon"
                  />
                  <span className="condition-text">{forecastDay.day.condition.text}</span>
                </div>
                <div className="forecast-details">
                  <div className="forecast-temp">
                    <span className="max-temp">{temp.max}{temp.unit}</span> / 
                    <span className="min-temp">{temp.min}{temp.unit}</span>
                  </div>
                  <div className="forecast-wind">
                    <span className="wind-icon">💨</span>
                    <span className="wind-speed">{wind.speed} {wind.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Forecast;