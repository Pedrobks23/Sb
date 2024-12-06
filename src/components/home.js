// src/components/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Atualizado para usar useNavigate no React Router v6
import '../styles/home.css'; // Estilos da home
import '../styles/shared.css'; // Estilo para a tela de seleção e cadastro de bikes

const Home = () => {
  const navigate = useNavigate(); // Hook para navegação no React Router v6

  // Função para navegar até a tela de Identificação
  const goToIdentificacao = () => {
    navigate('/identificacao'); // Redireciona para a tela de Identificação
  };

  return (
    <div className="home-container">
      <img src="Logo.png" alt="Logo" className="logo" /> {/* Logo do aplicativo */}
      <button className="btn-yellow" onClick={goToIdentificacao}>
        Toque aqui
      </button>
    </div>
  );
};

export default Home;
