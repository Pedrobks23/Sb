import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/servicos.css';
import '../styles/shared.css';

const SERVICE_ORDER = [
  'Lavagem',
  'Revisão Geral',
  'Revisão infantil',
  'Limpeza com regulagem',
  'Alinhamento de roda',
  'Regulagem Geral',
  'Regulagem Freio',
  'Regulagem Marcha',
  'Camara de ar 12 a 26',
  'Camara de ar 29',
  'Montagem aro 12',
  'Montagem aro 16 a 20',
  'Montagem aro 24 a 29',
  'Sangria de freio (cada freio)',
  'Serviço de raios (cada roda)'
];

const MULTIPLE_SERVICES = [
  'Sangria de freio (cada freio)', 
  'Serviço de raios (cada roda)', 
  'Câmara de ar 29', 
  'Câmara de ar 12 a 26',
  'Câmara de ar 700'
];

const Servicos = () => {
  const { telefone } = useParams();
  const navigate = useNavigate();

  const [bikes, setBikes] = useState([]); 
  const [selectedBike, setSelectedBike] = useState(null); 
  const [selectedServices, setSelectedServices] = useState({}); 
  const [observacoes, setObservacoes] = useState(""); 
  const [availableServices, setAvailableServices] = useState(null); 
  const [selectedBikesFromURL, setSelectedBikesFromURL] = useState([]); 
  const [savedBikesServices, setSavedBikesServices] = useState({});

  // Carregar bicicletas do usuário
  useEffect(() => {
    const loadBikes = async () => {
      try {
        const bikesRef = collection(db, 'clientes', telefone, 'bikes');
        const querySnapshot = await getDocs(bikesRef);
        const bikesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBikes(bikesList);
      } catch (error) {
        console.error("Erro ao carregar bicicletas:", error);
      }
    };

    loadBikes();
  }, [telefone]);

  // Carregar serviços do banco de dados
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicosRef = collection(db, 'servicos');
        const querySnapshot = await getDocs(servicosRef);
        const servicesDoc = querySnapshot.docs[0]?.data() || {};
        
        // Convertendo os valores para número
        const formattedServices = {};
        Object.entries(servicesDoc).forEach(([key, value]) => {
          const cleanValue = value.replace('R$', '').trim().replace(',', '.');
          formattedServices[key] = parseFloat(cleanValue);
        });

        setAvailableServices(formattedServices);
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
      }
    };

    loadServices();
  }, []);

  // Carregar bicicletas selecionadas da URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const bikesFromURL = JSON.parse(queryParams.get('selectedBikes') || '[]');
    setSelectedBikesFromURL(bikesFromURL);
  }, []);

  // Carregar serviços salvos para a bicicleta selecionada
  useEffect(() => {
    const loadSavedServices = async () => {
      if (selectedBike && availableServices) {
        try {
          const bikeServiceRef = doc(db, 'clientes', telefone, 'bikes', selectedBike);
          const bikeServiceDoc = await getDoc(bikeServiceRef);
          
          if (bikeServiceDoc.exists()) {
            const savedData = bikeServiceDoc.data();
            
            if (savedData.services) {
              setSelectedServices(savedData.services);
              setSavedBikesServices(prev => ({
                ...prev,
                [selectedBike]: {
                  services: savedData.services,
                  observacoes: savedData.observacoes || ""
                }
              }));
              setObservacoes(savedData.observacoes || "");
            } else {
              setSelectedServices({});
              setObservacoes("");
              setSavedBikesServices(prev => ({
                ...prev,
                [selectedBike]: {
                  services: {},
                  observacoes: ""
                }
              }));
            }
          }
        } catch (error) {
          console.error("Erro ao carregar serviços salvos:", error);
          setSelectedServices({});
          setObservacoes("");
        }
      }
    };

    loadSavedServices();
  }, [selectedBike, telefone, availableServices]);

  // Filtrar bicicletas selecionadas
  const filteredBikes = bikes.filter(bike => selectedBikesFromURL.includes(bike.id));

  // Função para calcular o total dos serviços
  const calculateTotal = (services) => {
    if (!availableServices || !services) return 0;
    
    return Object.entries(services)
      .reduce((total, [service, quantity]) => {
        if (quantity > 0) {
          return total + (availableServices[service] || 0) * quantity;
        }
        return total;
      }, 0);
  };

  // Função para lidar com a seleção de bicicleta
  const handleBikeSelect = (bikeId) => {
    setSelectedBike(bikeId);
  };

  // Função para atualizar os serviços selecionados
  const handleServiceChange = async (serviceId, isChecked) => {
    const quantity = isChecked ? 1 : 0;
    const newSelectedServices = {
      ...selectedServices,
      [serviceId]: quantity
    };
  
    setSelectedServices(newSelectedServices);
  
    if (selectedBike) {
      try {
        // Calcular o total aqui antes de salvar
        const total = calculateTotal(newSelectedServices);
        
        const bikeServiceRef = doc(db, 'clientes', telefone, 'bikes', selectedBike);
        await setDoc(bikeServiceRef, {
          services: newSelectedServices,
          observacoes,
          total: total // Salvando o total calculado
        }, { merge: true });
  
        setSavedBikesServices(prev => ({
          ...prev,
          [selectedBike]: {
            services: newSelectedServices,
            observacoes,
            total: total // Atualizando o total no estado
          }
        }));
      } catch (error) {
        console.error("Erro ao salvar serviços:", error);
      }
    }
  };

  const getOrderedServices = (availableServices) => {
    if (!availableServices) return [];
  
    // Cria um array de serviços com seus valores
    const servicesArray = Object.entries(availableServices)
      .filter(([service]) => service !== "id")
      .sort((a, b) => {
        // Pega o índice de cada serviço no SERVICE_ORDER
        const indexA = SERVICE_ORDER.indexOf(a[0]);
        const indexB = SERVICE_ORDER.indexOf(b[0]);
        
        // Se ambos estão no SERVICE_ORDER, ordena por índice
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // Se apenas um está no SERVICE_ORDER, ele vem primeiro
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // Se nenhum está no SERVICE_ORDER, ordena alfabeticamente
        return a[0].localeCompare(b[0]);
      });
  
    return servicesArray;
  };

  // Função para atualizar as observações
  const handleObservacoesChange = async (e) => {
    const newObservacoes = e.target.value;
    setObservacoes(newObservacoes);

    if (selectedBike) {
      try {
        const bikeServiceRef = doc(db, 'clientes', telefone, 'bikes', selectedBike);
        await setDoc(bikeServiceRef, {
          services: selectedServices,
          observacoes: newObservacoes
        }, { merge: true });

        setSavedBikesServices(prev => ({
          ...prev,
          [selectedBike]: {
            services: selectedServices,
            observacoes: newObservacoes
          }
        }));
      } catch (error) {
        console.error("Erro ao salvar observações:", error);
      }
    }
  };

  const handleBack = () => {
    navigate(`/bike-selection/${telefone}`);
  };

  const handleContinue = () => {
    // Pegar apenas as bicicletas que têm serviços selecionados
    const bikesWithServices = filteredBikes
        .filter(bike => {
            const bikeServices = savedBikesServices[bike.id]?.services || {};
            return Object.values(bikeServices).some(quantity => quantity > 0);
        })
        .map(bike => ({
            id: bike.id,
            marca: bike.marca,
            modelo: bike.modelo,
            cor: bike.cor,
            services: savedBikesServices[bike.id]?.services || {},
            observacoes: savedBikesServices[bike.id]?.observacoes || "",
            total: calculateTotal(savedBikesServices[bike.id]?.services)
        }));

   
        if (bikesWithServices.length === 0) {
          alert("Selecione pelo menos um serviço para continuar");
          return;
      }
  
      // Salvar no localStorage para persistência
      localStorage.setItem('selectedBikes', JSON.stringify(bikesWithServices));
      
      // Converter para string e codificar para URL
      const bikesParam = encodeURIComponent(JSON.stringify(bikesWithServices));
      
      // Navegar para a próxima página com os dados completos
      navigate(`/ordem-servico/${telefone}?bikes=${bikesParam}`);
  };

  return (
    <div className="page-container">
      <button onClick={handleBack} className="back-button">
        Voltar
      </button>
  
      <div className="servicos-container">
        <div className="services-panel">
          <h1>Selecione os Serviços</h1>
  
          <div className="bike-dropdown">
            <label>Selecione uma bicicleta</label>
            <select 
              onChange={(e) => handleBikeSelect(e.target.value)} 
              value={selectedBike || ''}
            >
              <option value="" disabled>Escolha...</option>
              {filteredBikes.map(bike => (
                <option key={bike.id} value={bike.id}>
                  {`${bike.marca} - ${bike.modelo} - ${bike.cor}`}
                </option>
              ))}
            </select>
          </div>
  
          <div className="servicos-lista">
            <h2>Serviços Disponíveis</h2>
            {availableServices && getOrderedServices(availableServices).map(([service, value], index) => {
              const isMultipleService = MULTIPLE_SERVICES.includes(service);
              const quantity = selectedServices[service] || 0;
  
              return (
                <div key={index} className="service-item">
                  <div className="service-info">
                    <input
                      type="checkbox"
                      id={service}
                      checked={quantity > 0}
                      onChange={(e) => handleServiceChange(service, e.target.checked ? 1 : 0)}
                      disabled={!selectedBike}
                    />
                    <label htmlFor={service}>
                      {service} - R$ {value.toFixed(2)}
                    </label>
                  </div>
                  {isMultipleService && (
                    <div className="quantity-controls">
                      <button 
                        className="quantity-button"
                        onClick={() => handleServiceChange(service, Math.max(0, quantity - 1))}
                        disabled={!selectedBike || quantity === 0}
                      >
                        -
                      </button>
                      <span className="quantity-display">{quantity}</span>
                      <button 
                        className="quantity-button"
                        onClick={() => handleServiceChange(service, quantity + 1)}
                        disabled={!selectedBike}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
  
          {selectedBike && (
            <div className="observacoes-container">
              <label htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={handleObservacoesChange}
                placeholder="Digite suas observações"
              />
            </div>
          )}
        </div>
  
        <div className="services-summary">
          <h2>Serviços Selecionados</h2>
          {filteredBikes.map(bike => (
            <div key={bike.id} className="bike-services-item">
              <strong>{`${bike.marca} - ${bike.modelo}`}</strong>
              <ul>
                {Object.entries(savedBikesServices[bike.id]?.services || {})
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([service, quantity], index) => (
                    <li key={index}>
                      <span>
                        {service}
                        {quantity > 1 && <span className="quantity-badge">x{quantity}</span>}
                      </span>
                      <span>R$ {(availableServices[service] * quantity).toFixed(2)}</span>
                    </li>
                  ))}
                {(!savedBikesServices[bike.id]?.services || 
                  Object.values(savedBikesServices[bike.id]?.services || {}).every(v => !v)) && (
                  <li>Nenhum serviço selecionado</li>
                )}
              </ul>
              {savedBikesServices[bike.id]?.services && 
               Object.values(savedBikesServices[bike.id].services).some(v => v > 0) && (
                <div className="total-value">
                  Total: R$ {calculateTotal(savedBikesServices[bike.id].services).toFixed(2)}
                </div>
              )}
            </div>
          ))}
  
          <div className="summary-footer">
            <div className="total-all-bikes">
              Total Geral: R$ {filteredBikes.reduce((total, bike) => {
                return total + calculateTotal(savedBikesServices[bike.id]?.services || {});
              }, 0).toFixed(2)}
            </div>
            <button onClick={handleContinue} className="continue-button">
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Servicos;