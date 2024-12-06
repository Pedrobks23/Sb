import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase'; // Ajuste o caminho corretamente
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Importando o hook de navegação
import '../styles/identificacao.css';
import '../styles/shared.css'; // Estilo para a tela de seleção e cadastro de bikes

const Identificacao = () => {
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [clientData, setClientData] = useState(null); // Armazena os dados do cliente para edição

  const navigate = useNavigate(); // Hook para navegação

  // Função para carregar os dados do cliente a partir do telefone
  useEffect(() => {
    const loadClientData = async () => {
      if (!telefone) return; // Não faz nada se o telefone estiver vazio

      const docRef = doc(db, 'clientes', telefone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setNome(data.nome);
        setEndereco(data.endereco || ''); // Se não houver endereço, coloca vazio
        setClientData(data); // Armazena os dados do cliente para edição
      } else {
        setClientData(null); // Cliente não encontrado
      }
    };

    loadClientData(); // Carrega os dados sempre que o telefone for alterado
  }, [telefone]);

  // Função para atualizar ou adicionar os dados do cliente
  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientRef = doc(db, 'clientes', telefone);
    if (clientData) {
      // Atualiza os dados se o cliente já existir
      await setDoc(clientRef, {
        nome,
        telefone,
        endereco,
      }, { merge: true }); // `merge: true` mantém os dados existentes e atualiza os novos
      console.log("Dados atualizados no banco!");
    } else {
      // Caso o cliente não exista, cria um novo
      await setDoc(clientRef, {
        nome,
        telefone,
        endereco,
      });
      console.log("Cliente adicionado no banco!");
    }

    // Redireciona para a tela de seleção de bikes após salvar os dados
    navigate(`/bike-selection/${telefone}`); // Passando o telefone para a tela de BikeSelection
  };

  // Função para voltar para a tela anterior
  const handleBack = () => {
    navigate('/'); // Navega de volta para a tela inicial
  };

  // Função para garantir que o telefone seja apenas numérico
  const handlePhoneChange = (e) => {
    // Substitui qualquer caractere não numérico por vazio
    setTelefone(e.target.value.replace(/[^0-9]/g, ''));
  };

  return (
    <div className="identificacao-container">
      {/* Exibindo as mensagens de status do cliente */}
      {telefone && clientData ? (
        <p>Cliente encontrado</p>
      ) : telefone ? (
        <p>Cliente não encontrado, preencha os dados abaixo</p>
      ) : null}

      {/* Formulário de Identificação */}
      <div className="input-group">
        <input
          type="text"
          placeholder="Telefone"
          value={telefone}
          onChange={handlePhoneChange} // Alteração para garantir apenas números
          maxLength="11" // Limita a 11 caracteres
        />
      </div>

      {clientData ? (
        <>
          <div className="input-group">
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Endereço (opcional)"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </div>
        </>
      ) : (
        telefone && (
          <>
            <div className="input-group">
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="Endereço (opcional)"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>
          </>
        )
      )}

      {/* Container para os botões */}
      <div className="btn-container">
        {/* Botão Voltar */}
        <button className="btn" onClick={handleBack}>
          Voltar
        </button>

        {/* Botão Continuar */}
        <button className="btn" onClick={handleSubmit}>
          Continuar
        </button>
      </div>
    </div>
  );
};

export default Identificacao;
