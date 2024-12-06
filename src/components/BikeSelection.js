import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../styles/bikeSelection.css';
import '../styles/shared.css';

const BikeSelection = () => {
  const [bikes, setBikes] = useState([]);
  const [selectedBikes, setSelectedBikes] = useState([]);
  const [showAddBike, setShowAddBike] = useState(false);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { telefone } = useParams();
  const location = useLocation();

  useEffect(() => {
    const loadBikes = async () => {
      if (!telefone) return;

      try {
        const clientRef = collection(db, 'clientes', telefone, 'bikes');
        const querySnapshot = await getDocs(clientRef);
        const bikesList = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          services: doc.data().services || {},
          total: doc.data().total || 0,
          observacoes: doc.data().observacoes || ''
        }));
        setBikes(bikesList);

        // Recuperar seleções anteriores
        const savedSelections = localStorage.getItem('selectedBikes');
        if (savedSelections) {
          setSelectedBikes(JSON.parse(savedSelections));
        } else if (location.state?.selectedBikes) {
          setSelectedBikes(location.state.selectedBikes);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar bicicletas:", error);
        alert("Erro ao carregar bicicletas. Por favor, tente novamente.");
        setLoading(false);
      }
    };

    loadBikes();
  }, [telefone, location]);

  const handleAddBike = async (e) => {
    e.preventDefault();

    if (!marca || !modelo || !cor) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const newBike = { 
        marca: marca.trim(), 
        modelo: modelo.trim(), 
        cor: cor.trim(),
        services: {},
        observacoes: '',
        total: 0
      };

      const bikesRef = collection(db, 'clientes', telefone, 'bikes');
      await addDoc(bikesRef, newBike);

      // Recarregar a lista de bicicletas
      const querySnapshot = await getDocs(bikesRef);
      const bikesList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        services: doc.data().services || {},
        total: doc.data().total || 0,
        observacoes: doc.data().observacoes || ''
      }));
      setBikes(bikesList);

      setMarca('');
      setModelo('');
      setCor('');
      setShowAddBike(false);
      alert("Bicicleta cadastrada com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar bicicleta:", error);
      alert("Erro ao cadastrar bicicleta. Por favor, tente novamente.");
    }
  };

  const handleSelectBike = (bike) => {
    setSelectedBikes(prevSelected => {
      const isSelected = prevSelected.some(selected => selected.id === bike.id);
      const newSelection = isSelected
        ? prevSelected.filter(selected => selected.id !== bike.id)
        : [...prevSelected, {
            id: bike.id,
            marca: bike.marca,
            modelo: bike.modelo,
            cor: bike.cor,
            services: bike.services || {},
            observacoes: bike.observacoes || '',
            total: bike.total || 0
          }];
      
      localStorage.setItem('selectedBikes', JSON.stringify(newSelection));
      return newSelection;
    });
  };

  const handleBack = () => {
    localStorage.removeItem('selectedBikes');
    navigate(`/identificacao`);
  };

  const handleContinue = () => {
    if (selectedBikes.length === 0) {
      alert("Por favor, selecione ao menos uma bicicleta.");
      return;
    }
  
    // Mudando de selectedBikes para esse formato que o Servicos espera
    const selectedBikesIds = selectedBikes.map(bike => bike.id);
    const queryString = new URLSearchParams({
      selectedBikes: JSON.stringify(selectedBikesIds)
    }).toString();
  
    navigate(`/servicos/${telefone}?${queryString}`);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="bike-selection-container">
      <h1>Bikes selecionadas {selectedBikes.length}</h1>

      <div className="card">
        <h2>Selecionar Bikes</h2>
        {bikes.length > 0 ? (
          <div className="bike-list">
            {bikes.map(bike => (
              <div key={bike.id} className="bike-item">
                <input 
                  type="checkbox" 
                  checked={selectedBikes.some(selected => selected.id === bike.id)} 
                  onChange={() => handleSelectBike(bike)} 
                />
                <span>{bike.marca} - {bike.modelo} - {bike.cor}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>Você ainda não tem bicicletas cadastradas.</p>
        )}
      </div>

      <div className="card">
        <h2>Cadastrar Bike</h2>
        {showAddBike ? (
          <form onSubmit={handleAddBike}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Marca" 
                value={marca} 
                onChange={(e) => setMarca(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Modelo" 
                value={modelo} 
                onChange={(e) => setModelo(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Cor" 
                value={cor} 
                onChange={(e) => setCor(e.target.value)} 
              />
            </div>
            <button type="submit">Cadastrar</button>
          </form>
        ) : (
          <button onClick={() => setShowAddBike(true)}>Cadastrar Nova Bike</button>
        )}
      </div>

      <div className="btn-container">
        <button className="btn-back" onClick={handleBack}>Voltar</button>
        <button className="btn-continue" onClick={handleContinue}>Continuar</button>
      </div>
    </div>
  );
};

export default BikeSelection;