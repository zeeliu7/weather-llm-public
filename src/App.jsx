import React from 'react';
import './App.css';
import Weather from './components/Weather';
import Realtime from './cards/Realtime.jsx'; // You mentioned this will be added later

function App() {
  return (
    <div className="App">
      <Weather />
      {/* The Realtime component will be used here later */}
      {/* <Realtime /> */}
    </div>
  );
}

export default App;