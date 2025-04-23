import React, { useState, useEffect } from 'react';
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
            <p>Forecast: "5 day Boston weather forecast in F in miles"</p>
            <p>Sun: "Sunset in Chicago"</p>
            <p>Moon: "Moonrise in NY"</p>
            <p>Moon Phase: "Moon phase in Atlanta"</p>
          </div>
        )}
      </div>

      <section className="flex justify-center items-center p-6 bg-gray-100 rounded-lg my-4">
        <a 
          href="https://github.com/zeeliu7/weather-llm-public" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-800 hover:text-blue-600 transition-colors duration-300"
        >
          {/* Custom GitHub SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          <span className="text-lg font-medium">View on GitHub</span>
        </a>
      </section>
    </div>

    
  );
};

export default Weather;
