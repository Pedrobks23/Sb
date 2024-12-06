// src/firebase/clientes.js
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';  // Importando o db já configurado de firebase.js

// Não há necessidade de declarar 'db' novamente, pois já está importado de './firebase'

// Função para adicionar cliente
export const addCliente = async (cliente) => {
  try {
    await addDoc(collection(db, 'clientes'), cliente);
    console.log("Cliente adicionado com sucesso");
  } catch (e) {
    console.error("Erro ao adicionar cliente: ", e);
  }
};

// Função para adicionar bicicleta
export const addBicicleta = async (bicicleta) => {
  try {
    await addDoc(collection(db, 'bicicletas'), bicicleta);
    console.log("Bicicleta adicionada com sucesso");
  } catch (e) {
    console.error("Erro ao adicionar bicicleta: ", e);
  }
};

// Função para adicionar ordem de serviço
export const addOrdemDeServico = async (ordem) => {
  try {
    await addDoc(collection(db, 'ordensDeServico'), ordem);
    console.log("Ordem de serviço adicionada com sucesso");
  } catch (e) {
    console.error("Erro ao adicionar ordem de serviço: ", e);
  }
};

// Função para buscar clientes
export const getClientes = async () => {
  const querySnapshot = await getDocs(collection(db, 'clientes'));
  const clientes = [];
  querySnapshot.forEach((doc) => {
    clientes.push(doc.data());
  });
  return clientes;
};
