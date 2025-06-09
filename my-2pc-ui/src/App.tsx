// App.tsx
import React from 'react';
// Import BrowserRouter, Routes, and Route
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

// Import all your main page components that will be rendered by routes
import Dashboard from './components/Dashboard';
import NodeDetail from './components/NodeDetail'; // For /nodes/:nodeId
import TransactionHistory from './components/TransactionHistory'; // For /history
import LiveVisualization from './components/LiveVisualization'; // For /visualization

function App() {
  return (
    // Wrap your entire application (or at least the parts needing routing) in BrowserRouter
    <BrowserRouter>
      {/* ThemeProvider should wrap your routes if the theme needs to apply to all pages */}
      <ThemeProvider>
        {/* Routes component is where you define your individual routes */}
        <Routes>
          {/* Define each route with its path and the component to render */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/visualization" element={<LiveVisualization />} />
          <Route path="/nodes/:nodeId" element={<NodeDetail />} />
          {/* Add more routes here if you have other main pages */}
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;