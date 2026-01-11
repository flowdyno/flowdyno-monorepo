import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import Home from './pages/Home';
import Editor from './pages/editor';

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
  }, [location]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <div className="min-h-screen bg-dark-900 text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
