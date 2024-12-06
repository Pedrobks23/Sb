// src/firebase/bicicletas.js
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const addBicicleta = async (bicicleta) => {
  try {
    const docRef = await addDoc(collection(db, "bicicletas"), bicicleta);
    console.log("Bicicleta adicionada com ID: ", docRef.id);
  } catch (e) {
    console.error("Erro ao adicionar bicicleta: ", e);
  }
};

export const getBicicletas = async () => {
  const querySnapshot = await getDocs(collection(db, "bicicletas"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
