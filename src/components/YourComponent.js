// src/components/TotemComponent.js

import React, { useState } from 'react';
import { addCliente, addBicicleta, addOrdemDeServico, getClientes } from '../firebase/clientes'; // Importe as funções de Firebase

function TotemComponent() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bicicletaMarca, setBicicletaMarca] = useState('');
  const [bicicletaModelo, setBicicletaModelo] = useState('');
  const [bicicletaCor, setBicicletaCor] = useState('');
  const [bicicletas, setBicicletas] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [statusOrdem, setStatusOrdem] = useState('pendente');
  
  // Função para adicionar cliente
  const handleAddCliente = () => {
    const cliente = {
      nome,
      telefone,
      endereco,
      bicicletas,
    };
    addCliente(cliente); // Chama a função do Firebase para adicionar cliente
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
    addBicicleta(bicicleta); // Chama a função do Firebase para adicionar bicicleta
    setBicicletas([...bicicletas, bicicleta]);
  };

  // Função para adicionar ordem de serviço
  const handleAddOrdemDeServico = () => {
    const ordem = {
      telefone,
      nome,
      data: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      bicicletas,
      servicos,
      status: statusOrdem,
      valorTotal: servicos.reduce((acc, servico) => acc + servico.valor, 0),
    };
    addOrdemDeServico(ordem); // Chama a função do Firebase para adicionar ordem de serviço
  };

  return (
    <div>
      <h1>Cadastro de Cliente e Bicicleta</h1>

      {/* Formulário para adicionar cliente */}
      <h2>Cliente</h2>
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
      <h2>Bicicleta</h2>
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

      {/* Formulário para adicionar ordem de serviço */}
      <h2>Ordem de Serviço</h2>
      <button onClick={handleAddOrdemDeServico}>Adicionar Ordem de Serviço</button>

      {/* Exibição dos clientes e bicicletas */}
      <h2>Clientes Cadastrados</h2>
      <div>
        {getClientes().map((cliente) => (
          <div key={cliente.telefone}>
            <p>{cliente.nome}</p>
            <p>{cliente.telefone}</p>
            <p>{cliente.endereco}</p>
            <h3>Bicicletas:</h3>
            {cliente.bicicletas.map((bicicleta) => (
              <div key={bicicleta.bicicletaId}>
                <p>{bicicleta.marca} - {bicicleta.modelo} - {bicicleta.cor}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TotemComponent;
