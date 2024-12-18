import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch 
} from 'firebase/firestore';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../styles/ordemServico.css';
import '../styles/shared.css';

const OrdemServico = () => {
  const { telefone } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [clienteData, setClienteData] = useState(null);
  const [selectedBikes, setSelectedBikes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [totalGeral, setTotalGeral] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState(false);
  const [editedClientData, setEditedClientData] = useState({
    nome: '',
    telefone: '',
    endereco: ''
  });
  const [availableServices, setAvailableServices] = useState(null);

  const validateDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    return selectedDay >= today; // Agora inclui o dia atual
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (validateDate(newDate)) {
      setSelectedDate(newDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      e.target.value = today;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const clienteRef = doc(db, 'clientes', telefone);
        const clienteDoc = await getDoc(clienteRef);
        
        if (clienteDoc.exists()) {
          const data = clienteDoc.data();
          setClienteData(data);
          setEditedClientData({
            nome: data.nome || '',
            telefone: data.telefone || telefone,
            endereco: data.endereco || ''
          });
        }

        const servicosRef = collection(db, 'servicos');
        const servicosSnapshot = await getDocs(servicosRef);
        const servicesDoc = servicosSnapshot.docs[0]?.data() || {};
        
        const formattedServices = {};
        Object.entries(servicesDoc).forEach(([key, value]) => {
          const cleanValue = value.replace('R$', '').trim().replace(',', '.');
          formattedServices[key] = parseFloat(cleanValue);
        });

        setAvailableServices(formattedServices);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    
    loadData();
  }, [telefone]);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const bikesParam = searchParams.get('bikes');
      
      if (bikesParam) {
        const bikesData = JSON.parse(decodeURIComponent(bikesParam));
        setSelectedBikes(bikesData);
        
        const total = bikesData.reduce((acc, bike) => acc + bike.total, 0);
        setTotalGeral(total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados das bicicletas:", error);
      setLoading(false);
    }
  }, [location.search]);

  const handleEditClient = () => {
    setEditingClient(true);
  };

  const handleSaveClientData = async () => {
    try {
      const clienteRef = doc(db, 'clientes', telefone);
      await updateDoc(clienteRef, editedClientData);
      setClienteData(editedClientData);
      setEditingClient(false);
    } catch (error) {
      console.error("Erro ao atualizar dados do cliente:", error);
      alert('Erro ao atualizar dados do cliente. Tente novamente.');
    }
  };

  const handleConfirmarOrdem = async () => {
    if (!selectedDate) {
      alert('Por favor, selecione uma data para o serviço');
      return;
    }

    try {
      const bikesRef = collection(db, 'clientes', telefone, 'bikes');
      const bikesSnapshot = await getDocs(bikesRef);
      const existingBikes = {};
      
      bikesSnapshot.forEach(doc => {
        existingBikes[doc.id] = true;
      });

      if (!selectedBikes || selectedBikes.length === 0) {
        alert('Por favor, selecione pelo menos uma bicicleta.');
        navigate(`/bike-selection/${telefone}`);
        return;
      }

      const missingBikes = selectedBikes.filter(bike => !existingBikes[bike.id]);
      
      if (missingBikes.length > 0) {
        const errorMessage = `As seguintes bicicletas não foram encontradas: ${
          missingBikes.map(bike => `${bike.marca} ${bike.modelo}`).join(', ')
        }. Por favor, selecione as bicicletas novamente.`;
        
        alert(errorMessage);
        navigate(`/bike-selection/${telefone}`, {
          state: { selectedBikes: selectedBikes.filter(bike => existingBikes[bike.id]) }
        });
        return;
      }

      const now = new Date();
      const ano = now.getFullYear();
      const mes = (now.getMonth() + 1).toString().padStart(2, '0');
      
      const ordensRef = collection(db, 'ordens');
      const mesAtualQuery = query(
        ordensRef,
        where('codigo', '>=', `OS-${ano}${mes}`),
        where('codigo', '<=', `OS-${ano}${mes}\uf8ff`),
        orderBy('codigo', 'desc'),
        limit(1)
      );
      
      const mesAtualSnap = await getDocs(mesAtualQuery);
      const ultimaOrdem = mesAtualSnap.docs[0]?.data();
      const sequencial = (ultimaOrdem?.sequencial || 0) + 1;
      
      const codigoOS = `OS-${ano}${mes}${sequencial.toString().padStart(3, '0')}`;
      const urlOS = `${window.location.origin}/consulta?os=${codigoOS}`;

      const novaOrdem = {
        codigo: codigoOS,
        urlOS,
        mes,
        ano,
        sequencial,
        cliente: {
          ...clienteData,
          telefone
        },
        dataAgendamento: new Date(selectedDate + 'T12:00:00').toISOString(),
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        status: 'Pendente',
        bicicletas: selectedBikes.map(bike => ({
          id: bike.id,
          marca: bike.marca,
          modelo: bike.modelo,
          cor: bike.cor,
          services: bike.services || {},
          observacoes: bike.observacoes || '',
          total: bike.total || 0
        })),
        valorTotal: totalGeral, // Aqui está o total
        termoBusca: `${clienteData.nome} ${telefone} ${codigoOS}`.toLowerCase(),
        totalBikes: selectedBikes.length
      };
      
      const docRef = await addDoc(ordensRef, novaOrdem);

      const batch = writeBatch(db);
      
      selectedBikes.forEach(bike => {
        const bikeRef = doc(bikesRef, bike.id);
        batch.update(bikeRef, {
          services: {},
          total: 0,
          observacoes: ''
        });
      });

      await batch.commit();

      await navigate(`/confirmacao/${docRef.id}`, { 
        state: { 
          codigoOS,
          urlOS,
          totalBikes: selectedBikes.length,
          orderId: docRef.id
        },
        replace: true
      });

      localStorage.removeItem('selectedBikes');
      localStorage.removeItem('selectedServices');

    } catch (error) {
      console.error("Erro ao criar ordem de serviço:", error);
      alert(error.message || 'Erro ao criar ordem de serviço. Por favor, tente novamente.');
    }
  };

  const handleBack = () => {
    // Na tela OrdemServico
    const searchParams = new URLSearchParams(location.search);
    const bikesParam = searchParams.get('bikes');
    
    if (bikesParam) {
      const selectedBikesIds = selectedBikes.map(bike => bike.id);
      const queryParams = new URLSearchParams({
        selectedBikes: JSON.stringify(selectedBikesIds)
      }).toString();
      
      navigate(`/servicos/${telefone}?${queryParams}`);
    } else {
      navigate(`/servicos/${telefone}`);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <>
      <button onClick={handleBack} className="back-button">
        Voltar
      </button>

      <div className="ordem-servico-container">
        <div className="ordem-content">
          <h1>Ordem de Serviço</h1>

          <div className="cliente-info">
            <div className="cliente-header">
              <h2>Dados do Cliente</h2>
              {!editingClient && (
                <button onClick={handleEditClient} className="edit-button">
                  Editar Dados
                </button>
              )}
            </div>
            {editingClient ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Nome:</label>
                  <input
                    type="text"
                    value={editedClientData.nome}
                    onChange={(e) => setEditedClientData({
                      ...editedClientData,
                      nome: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Endereço:</label>
                  <input
                    type="text"
                    value={editedClientData.endereco}
                    onChange={(e) => setEditedClientData({
                      ...editedClientData,
                      endereco: e.target.value
                    })}
                  />
                </div>
                <button onClick={handleSaveClientData} className="save-button">
                  Salvar
                </button>
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <label>Nome:</label>
                  <span>{clienteData?.nome}</span>
                </div>
                <div className="info-item">
                  <label>Telefone:</label>
                  <span>{telefone}</span>
                </div>
                {clienteData?.endereco && (
                  <div className="info-item full-width">
                    <label>Endereço:</label>
                    <span>{clienteData.endereco}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bikes-services">
            <h2>Bicicletas e Serviços Selecionados</h2>
            {selectedBikes.map((bike) => (
              <div key={bike.id} className="bike-card">
                <h3>{bike.marca} - {bike.modelo} - {bike.cor}</h3>
                <div className="services-list">
                  {Object.entries(bike.services)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([service, quantity], index) => (
                      <div key={index} className="service-item">
                        <div className="service-info">
                          <span className="service-name">{service}</span>
                          {quantity > 1 && (
                            <span className="quantity-badge">x{quantity}</span>
                          )}
                        </div>
                        <span className="service-price">
                          R$ {(availableServices?.[service] * quantity || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
                {bike.observacoes && (
                  <div className="observacoes">
                    <strong>Observações:</strong>
                    <p>{bike.observacoes}</p>
                  </div>
                )}
                <div className="bike-total">
                  Total: R$ {bike.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="agendamento">
            <h2>Agendamento</h2>
            <div className="date-picker">
              <label htmlFor="data">Selecione a Data:</label>
              <input
                type="date"
                id="data"
                value={selectedDate}
                onChange={handleDateChange}
                onKeyDown={(e) => e.preventDefault()}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="ordem-footer">
            <div className="total-geral">
              Total Geral: R$ {totalGeral.toFixed(2)}
            </div>
            <button 
              onClick={handleConfirmarOrdem}
              className="confirm-button"
              disabled={!selectedDate}
            >
              Confirmar Ordem de Serviço
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdemServico;