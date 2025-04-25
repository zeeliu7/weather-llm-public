import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import './Weather.css';
import Sun from '../cards/Sun';
import Moon from '../cards/Moon';
import MoonPhase from '../cards/MoonPhase';
import Forecast from '../cards/Forecast';
import Realtime from '../cards/Realtime';

const WITAI_CLIENT_ACCESS_TOKEN = import.meta.env.VITE_WITAI_CLIENT_ACCESS_TOKEN;

const Weather = () => {
  const [query, setQuery] = useState('');
  const [tempUnit, setTempUnit] = useState('Celsius');
  const [measurementSystem, setMeasurementSystem] = useState('Metric');
  const [witData, setWitData] = useState(null);
  const [weatherComponents, setWeatherComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  async function handleSubmit(e) {
    e?.preventDefault();
    
    // Clear previous states
    setError(null);
    setWeatherComponents([]);
    
    // get result from WitAI
    const input = query?.trim();
    if (input) {
      setIsLoading(true);
      
      try {
        // Clear input field
        setQuery("");
        
        const resp = await fetch("https://api.wit.ai/message?q=" + encodeURIComponent(input), {
          headers: {
            "Authorization": "Bearer " + WITAI_CLIENT_ACCESS_TOKEN
          }
        });
        
        if (!resp.ok) {
          throw new Error(`API responded with status: ${resp.status}`);
        }
        
        const data = await resp.json();
        setWitData(data);

      } catch (err) {
        setError(`Failed to get AI response: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (witData) {
      parseAiResponse();
    }
  }, [witData]);

  function extractUserSpecifiedUnits() {
    let userSpecifiedTempUnit = tempUnit;
    let userSpecifiedMeasurementSystem = measurementSystem;
    
    const unitEntities = witData?.entities?.["temperature_unit:temperature_unit"] || [];
    
    for (const entity of unitEntities) {
      const value = entity.value?.toLowerCase();
      
      // Check for temperature units
      if (value === 'fahrenheit') {
        userSpecifiedTempUnit = 'Fahrenheit';
      } else if (value === 'celsius') {
        userSpecifiedTempUnit = 'Celsius';
      }
      
      // Check for measurement systems
      else if (value === 'imperial') {
        userSpecifiedMeasurementSystem = 'Imperial';
      } else if (value === 'metric') {
        userSpecifiedMeasurementSystem = 'Metric';
      }
    }

    return {
      tempUnit: userSpecifiedTempUnit,
      measurementSystem: userSpecifiedMeasurementSystem
    };
  }

  function parseAiResponse() {
    const matchedName = witData?.intents[0]?.name;
    
    if (!matchedName) {
      setError("I couldn't understand that query. Please try rephrasing it.");
      return;
    } 
    
    try {
      // console.log("Intent matched:", matchedName);
      // console.log("Full WitAI response:", witData);
      
      const userUnits = extractUserSpecifiedUnits();
      
      if (matchedName === "sun_moon_phase") {
        handleSunMoonPhase(userUnits);
      } else if (matchedName === "weather_forecast") {
        handleWeatherForecast(userUnits);
      } else if (matchedName === "realtime_weather") {
        handleRealtimeWeather(userUnits);
      } else {
        setError(`I understood your query as "${matchedName}" but I don't have that feature implemented yet.`);
      }
    } catch (err) {
      console.error("Error in parseAiResponse:", err);
      setError(`Error processing weather data: ${err.message}`);
    }
  }

  function handleWeatherForecast(userUnits) {
    const locations = witData?.entities?.["wit$location:location"] || [];
    const durationEntities = witData?.entities?.["wit$duration:duration"] || [];
    
    // console.log("Extracted entities:", {
    //   locations: locations,
    //   durations: durationEntities
    // });
    
    if (locations.length === 0) {
      setError("Please specify a location for the weather forecast.");
      return;
    }
    
    // Track unique locations by coordinates to prevent duplicates
    const uniqueLocations = new Map();
    
    locations.forEach(location => {
      const locationData = location.resolved?.values[0];
      if (!locationData || !locationData.coords) {
        return;
      }
      
      // Create a unique key using the coordinates
      const locationKey = `${locationData.coords.lat.toFixed(4)},${locationData.coords.long.toFixed(4)}`;
      
      // Only add if this location hasn't been added yet
      if (!uniqueLocations.has(locationKey)) {
        uniqueLocations.set(locationKey, {
          name: locationData.name,
          region: locationData.external?.wikipedia || location.body,
          coords: locationData.coords
        });
      }
    });
    
    const weatherCards = [];
    
    // Calculate forecast duration
    let normalizedPeriod = 2 * 24 * 60 * 60; // Default 2 days
    if (durationEntities.length > 0) {
      const durationSeconds = durationEntities[0].normalized?.value;
      if (durationSeconds) {
        const daysFromSeconds = Math.ceil(durationSeconds / (24 * 60 * 60));
        // Apply minimum of 2 days, maximum of 14 days
        normalizedPeriod = Math.max(2, Math.min(14, daysFromSeconds)) * 24 * 60 * 60;
      }
    }
    
    // Convert the unique locations Map to an array and create cards
    Array.from(uniqueLocations.entries()).forEach(([key, locationInfo], index) => {
      if (!locationInfo.name) {
        return;
      }
      
      weatherCards.push(
        <Forecast 
          key={`forecast-${locationInfo.name}-${index}-${Date.now()}`} 
          location={locationInfo}
          tempUnit={userUnits.tempUnit}
          measurementSystem={userUnits.measurementSystem}
          normalizedPeriod={normalizedPeriod}
        />
      );
    });
    
    if (weatherCards.length > 0) {
      setWeatherComponents(weatherCards);
    } else {
      setError("I couldn't create any weather forecast cards with the information provided.");
      // console.log("Debug - Locations:", locations, "Durations:", durationEntities);
    }
  }

  function handleRealtimeWeather(userUnits) {
    const locations = witData?.entities?.["wit$location:location"] || [];
    
    // console.log("Extracted entities for realtime weather:", {
    //   locations: locations,
    //   temperatureUnits: witData?.entities?.["temperature_unit:temperature_unit"] || []
    // });
    
    if (locations.length === 0) {
      setError("Please specify a location for the current weather.");
      return;
    }
    
    // Track unique locations by coordinates to prevent duplicates
    const uniqueLocations = new Map();
    
    locations.forEach(location => {
      const locationData = location.resolved?.values[0];
      if (!locationData || !locationData.coords) {
        return;
      }
      
      // Create a unique key using the coordinates
      const locationKey = `${locationData.coords.lat.toFixed(4)},${locationData.coords.long.toFixed(4)}`;
      
      // Only add if this location hasn't been added yet
      if (!uniqueLocations.has(locationKey)) {
        uniqueLocations.set(locationKey, {
          name: locationData.name,
          region: locationData.external?.wikipedia || location.body,
          coords: locationData.coords
        });
      }
    });
    
    const weatherCards = [];
    
    // Convert the unique locations Map to an array and create cards
    Array.from(uniqueLocations.entries()).forEach(([key, locationInfo], index) => {
      if (!locationInfo.name) {
        return;
      }
      
      weatherCards.push(
        <Realtime 
          key={`realtime-${locationInfo.name}-${index}-${Date.now()}`} 
          location={locationInfo}
          tempUnit={userUnits.tempUnit}
          measurementSystem={userUnits.measurementSystem}
        />
      );
    });
    
    if (weatherCards.length > 0) {
      setWeatherComponents(weatherCards);
    } else {
      setError("I couldn't create any current weather cards with the information provided.");
      // console.log("Debug - Locations:", locations);
    }
  }

  function handleSunMoonPhase(userUnits) {
    const sunMoonEntities = witData?.entities?.["sun_moon:sun_moon"] || [];
    const locations = witData?.entities?.["wit$location:location"] || [];
    
    // console.log("Extracted entities:", {
    //   sunMoon: sunMoonEntities,
    //   locations: locations
    // });
    
    if (sunMoonEntities.length === 0 || locations.length === 0) {
      setError("Please specify both a celestial body (sun/moon) and a location.");
      return;
    }
    
    // Track unique locations by coordinates to prevent duplicates
    const uniqueLocations = new Map();
    
    locations.forEach(location => {
      const locationData = location.resolved?.values[0];
      if (!locationData || !locationData.coords) {
        return;
      }
      
      // Create a unique key using the coordinates
      const locationKey = `${locationData.coords.lat.toFixed(4)},${locationData.coords.long.toFixed(4)}`;
      
      // Only add if this location hasn't been added yet
      if (!uniqueLocations.has(locationKey)) {
        uniqueLocations.set(locationKey, {
          name: locationData.name,
          region: locationData.external?.wikipedia || location.body,
          coords: locationData.coords
        });
      }
    });
    
    const weatherCards = [];
    const celestialBodyValue = sunMoonEntities[0]?.value?.toLowerCase();
    // console.log("Celestial body value:", celestialBodyValue);
    
    const isSunRelated = celestialBodyValue === 'sun';
    const isMoonPhaseRelated = celestialBodyValue === 'moon phase';
    const isMoonRelated = celestialBodyValue === 'moon';
    
    // Convert the unique locations Map to an array and create cards
    Array.from(uniqueLocations.entries()).forEach(([key, locationInfo], index) => {
      if (!locationInfo.name) {
        return;
      }
      
      if (isSunRelated) {
        weatherCards.push(
          <Sun 
            key={`sun-${locationInfo.name}-${index}-${Date.now()}`} 
            location={locationInfo}
            tempUnit={userUnits.tempUnit}
            measurementSystem={userUnits.measurementSystem}
          />
        );
      } else if (isMoonPhaseRelated) {
        weatherCards.push(
          <MoonPhase 
            key={`moonphase-${locationInfo.name}-${index}-${Date.now()}`} 
            location={locationInfo}
            tempUnit={userUnits.tempUnit}
            measurementSystem={userUnits.measurementSystem}
          />
        );
      } else if (isMoonRelated) {
        weatherCards.push(
          <Moon 
            key={`moon-${locationInfo.name}-${index}-${Date.now()}`} 
            location={locationInfo}
            tempUnit={userUnits.tempUnit}
            measurementSystem={userUnits.measurementSystem}
          />
        );
      }
    });
    
    if (weatherCards.length > 0) {
      setWeatherComponents(weatherCards);
    } else {
      setError("I couldn't create any weather cards with the information provided.");
      // console.log("Debug - Sun/Moon:", sunMoonEntities, "Locations:", locations);
    }
  }

  const handleTempUnitChange = (e) => {
    setTempUnit(e.target.value);
  };

  const handleMeasurementSystemChange = (e) => {
    setMeasurementSystem(e.target.value);
  };

  return (
    <div className="weather-container">
      <div className="weather-header">
        <h1>Get weather information with natural language!</h1>
        <p>Default units (could be overridden in input)</p>
        
        <div className="unit-options">
          <div className="option-group">
            <label className="radio-label">
              <input
                type="radio"
                name="temperature"
                value="Celsius"
                checked={tempUnit === 'Celsius'}
                onChange={handleTempUnitChange}
              />
              Celsius
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="temperature"
                value="Fahrenheit"
                checked={tempUnit === 'Fahrenheit'}
                onChange={handleTempUnitChange}
              />
              Fahrenheit
            </label>
          </div>
          
          <div className="option-group">
            <label className="radio-label">
              <input
                type="radio"
                name="measurement"
                value="Metric"
                checked={measurementSystem === 'Metric'}
                onChange={handleMeasurementSystemChange}
              />
              Metric
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="measurement"
                value="Imperial"
                checked={measurementSystem === 'Imperial'}
                onChange={handleMeasurementSystemChange}
              />
              Imperial
            </label>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="weather-form">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="3 day weather in LA in F in miles"
          className="weather-input"
        />
        <button type="submit" className="weather-button" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get Weather'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="weather-results">
        {isLoading ? (
          <div className="loading-indicator">Loading weather data...</div>
        ) : weatherComponents.length > 0 ? (
          <div className="weather-cards-container">
            {weatherComponents}
          </div>
        ) : (
          <div className="weather-data-placeholder">
            <p>Supported features:</p>
            <p>Realtime: "Weather in LA in Fahrenheit in imperial"</p>
            <p>Forecast (7 days max): "3 day Boston weather forecast in F in miles"</p>
            <p>Sun: "Sunset in Chicago"</p>
            <p>Moon: "Moonrise in NY"</p>
            <p>Moon Phase: "Moon phase in Atlanta"</p>
          </div>
        )}
      </div>

      <div className="footer-links" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '30px',
        gap: '15px'
      }}>
        <a 
          href="https://github.com/zeeliu7/weather-llm-public" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 16px',
            backgroundColor: '#4285f4',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3367d6'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="github-icon" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.7-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          View on GitHub
        </a>
      
        <a 
          href="https://forms.gle/LdYEFJKYphgEgjok8"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 16px',
            backgroundColor: '#db4437',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#db4437'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="error-icon" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          Report an Error
        </a>
      </div>
    </div>
  );
};

export default Weather;
