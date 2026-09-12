import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './context/QueryProvider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { MyData } from './pages/MyData';
import { SavedResults } from './pages/SavedResults';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';
import { About } from './pages/About';

export function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/my-data" element={<MyData />} />
            <Route path="/saved-results" element={<SavedResults />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
