import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Inicio from './components/Inicio';
import Login from './components/Login';
import Registro from './components/Registro';
import Dashboard from './components/Dashboard';
import DashboardAdmin from './components/DashboardAdmin';
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
