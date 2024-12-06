// src/components/TestScreen.js

import React, { useState } from 'react';
import { addCliente, addBicicleta, getClientes } from '../firebase/clientes';

function TestScreen() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bicicletaMarca, setBicicletaMarca] = useState('');
  const [bicicletaModelo, setBicicletaModelo] = useState('');
  const [bicicletaCor, setBicicletaCor] = useState('');
  const [bicicletas, setBicicletas] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Função para adicionar cliente
  const handleAddCliente = async () => {
    const cliente = {
      nome,
      telefone,
      endereco,
      bicicletas: bicicletas.map(bic => bic.bicicletaId), // Vincula bicicletas pelo ID
    };
    await addCliente(cliente);
    setClientes(await getClientes()); // Atualiza a lista de clientes
  };

  // Função para adicionar bicicleta
  const handleAddBicicleta = () => {
    const bicicleta = {
      bicicletaId: Math.random().toString(36).substring(2), // Geração simples de ID
      marca: bicicletaMarca,
      modelo: bicicletaModelo,
      cor: bicicletaCor,
      telefone,
    };
    addBicicleta(bicicleta); // Adiciona a bicicleta no Firebase
    setBicicletas([...bicicletas, bicicleta]); // Atualiza o estado com as bicicletas
  };

  return (
    <div>
      <h1>Teste de Comunicação com Firebase</h1>

      {/* Formulário para adicionar cliente */}
      <h2>Adicionar Cliente</h2>
      <input
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <input
        type="text"
        placeholder="Telefone"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />
      <input
        type="text"
        placeholder="Endereço (opcional)"
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
      />
      <button onClick={handleAddCliente}>Adicionar Cliente</button>

      {/* Formulário para adicionar bicicleta */}
      <h2>Adicionar Bicicleta</h2>
      <input
        type="text"
        placeholder="Marca"
        value={bicicletaMarca}
        onChange={(e) => setBicicletaMarca(e.target.value)}
      />
      <input
        type="text"
        placeholder="Modelo"
        value={bicicletaModelo}
        onChange={(e) => setBicicletaModelo(e.target.value)}
      />
      <input
        type="text"
        placeholder="Cor"
        value={bicicletaCor}
        onChange={(e) => setBicicletaCor(e.target.value)}
      />
      <button onClick={handleAddBicicleta}>Adicionar Bicicleta</button>

      {/* Exibindo os clientes e suas bicicletas */}
      <h2>Clientes e suas Bicicletas</h2>
      <div>
        {clientes.map((cliente, index) => (
          <div key={index}>
            <h3>{cliente.nome} ({cliente.telefone})</h3>
            <h4>Bicicletas:</h4>
            {cliente.bicicletas.map((bicicletaId) => (
              <div key={bicicletaId}>
                <p>{bicicletaId}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestScreen;
