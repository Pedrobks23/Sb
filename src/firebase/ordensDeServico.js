// src/firebase/ordensDeServico.js
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const addOrdemDeServico = async (ordem) => {
  try {
    const docRef = await addDoc(collection(db, "ordensDeServico"), ordem);
    console.log("Ordem de serviço adicionada com ID: ", docRef.id);
  } catch (e) {
    console.error("Erro ao adicionar ordem de serviço: ", e);
  }
};

export const getOrdensDeServico = async () => {
  const querySnapshot = await getDocs(collection(db, "ordensDeServico"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

