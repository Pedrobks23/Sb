import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/identificacao.css';
import '../styles/shared.css';

const Identificacao = () => {
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [clientData, setClientData] = useState(null);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const loadClientData = async () => {
      if (!telefone) {
        setNome('');
        setEndereco('');
        setClientData(null);
        return;
      }

      const docRef = doc(db, 'clientes', telefone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setNome(data.nome);
        setEndereco(data.endereco || '');
        setClientData(data);
      } else {
        setNome('');
        setEndereco('');
        setClientData(null);
      }
    };

    loadClientData();
  }, [telefone]);

  const validateForm = () => {
    const newErrors = {};

    if (!telefone) {
      newErrors.telefone = 'Digite o telefone';
    } else if (telefone.length < 8) {
      newErrors.telefone = 'Telefone inválido';
    }

    setErrors(newErrors);

    // Validação do nome com alert
    if (!nome.trim()) {
      alert('Digite o nome do cliente');
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const clientRef = doc(db, 'clientes', telefone);
    if (clientData) {
      await setDoc(clientRef, {
        nome,
        telefone,
        endereco,
      }, { merge: true });
      console.log("Dados atualizados no banco!");
    } else {
      await setDoc(clientRef, {
        nome,
        telefone,
        endereco,
      });
      console.log("Cliente adicionado no banco!");
    }

    navigate(`/bike-selection/${telefone}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 12) {
      setTelefone(value);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setNome(value);
    }
  };

  return (
    <div className="identificacao-container">
      {telefone && clientData ? (
        <p>Cliente encontrado</p>
      ) : telefone ? (
        <p>Cliente não encontrado, preencha os dados abaixo</p>
      ) : null}

      <div className="input-group">
        <input
          type="text"
          placeholder="Telefone *"
          value={telefone}
          onChange={handlePhoneChange}
          maxLength="12"
        />
        {errors.telefone && <span className="error-message">{errors.telefone}</span>}
      </div>

      {clientData ? (
        <>
          <div className="input-group">
            <input
              type="text"
              placeholder="Nome *"
              value={nome}
              onChange={handleNameChange}
              maxLength="30"
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
                placeholder="Nome *"
                value={nome}
                onChange={handleNameChange}
                maxLength="30"
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

      <div className="btn-container">
        <button className="btn" onClick={handleBack}>
          Voltar
        </button>
        <button className="btn" onClick={handleSubmit}>
          Continuar
        </button>
      </div>
    </div>
  );
};

export default Identificacao;