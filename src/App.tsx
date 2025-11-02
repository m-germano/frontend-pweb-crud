// App.tsx (Pode permanecer igual)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';
import ContinentsPage from '@/pages/ContinentsPage';
import CountriesPage from '@/pages/CountriesPage';
import CitiesPage from '@/pages/CitiesPage';
import NotFound from '@/pages/NotFound';
import ToastifyContainer from '@/components/ToastifyContainer';

export default function App() {
  return (
    <>
      <ToastifyContainer />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="continents" element={<ContinentsPage />} />
            <Route path="countries" element={<CountriesPage />} />
            <Route path="cities" element={<CitiesPage />} />
            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}