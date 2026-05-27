import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Login from './components/Login';
import Registro from './components/Registro';
import Dashboard from './components/Dashboard';
import DashboardAdmin from './components/DashboardAdmin';
import ErrorPage from './components/ErrorPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/dashboard_admin" element={<DashboardAdmin />} />

        /* Rutas de prueba de errores */
        <Route path="/error404" element={<ErrorPage code={404} />} />
        <Route path="/error408" element={<ErrorPage code={408} />} />
        <Route path="/error500" element={<ErrorPage code={500} />} />
        <Route path="/error503" element={<ErrorPage code={503} />} />

        /* Catch-all para rutas inexistentes */
        <Route path="*" element={<ErrorPage code={404} />} />
      </Routes>
    </Router>
  );
}

export default App;
