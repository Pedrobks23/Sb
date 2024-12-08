import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';
import '../styles/shared.css';

const Home = () => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const goToIdentificacao = () => {
    navigate('/identificacao');
  };

  const handleImageError = () => {
    console.error('Erro ao carregar a imagem');
    setImageError(true);
  };

  return (
    <div className="home-container">
      <img 
        src={imageError ? 'Logo.png' : '/Logo.png'} // Tenta caminhos alternativos
        alt="Logo" 
        className="logo"
        onError={handleImageError}
      />
      <button 
        className="btn-yellow" 
        onClick={goToIdentificacao}
      >
        Toque aqui
      </button>
    </div>
  );
};

export default Home;