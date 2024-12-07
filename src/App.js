import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/home';
import Identificacao from './components/Identificacao';
import BikeSelection from './components/BikeSelection';
import Servicos from './components/servicos';
import OrdemServico from './components/OrdemServico';
import Confirmacao from './components/Confirmacao';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/identificacao" element={<Identificacao />} />
        <Route path="/bike-selection/:telefone" element={<BikeSelection />} />
        <Route path="/servicos/:telefone" element={<Servicos />} />
        <Route path="/ordem-servico/:telefone" element={<OrdemServico />} />
        <Route path="/confirmacao/:orderId" element={<Confirmacao />} /> 
      </Routes>
    </Router>
  );
}

export default App;