import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firesbase/config';
import { useAuth } from '../context/AuthContext';
import './AddProductForm.css';
import { useModal } from '../context/ModalContext';

const AddProductForm = () => {
  const { userProfile } = useAuth();
  const { showModal } = useModal();
  const [formData, setFormData] = useState({
    nombre: '',
    bodega: '',
    barra: '',
    stockMin: '',
    stockMax: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      showModal({ title: 'Error', message: 'El nombre del producto es obligatorio.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const bodega = Number(formData.bodega) || 0;
      const barra = Number(formData.barra) || 0;

      await addDoc(collection(db, 'inventory'), {
        nombre: formData.nombre,
        bodega: bodega,
        barra: barra,
        stockMin: Number(formData.stockMin) || 0,
        stockMax: Number(formData.stockMax) || 0,
        ingreso: bodega, // El ingreso inicial es lo que hay en bodega
        salida: 0,
        total: bodega + barra,
        responsable: `${userProfile.nombre} ${userProfile.apellido}`,
        lastUpdated: serverTimestamp(),
      });

      showModal({
        title: 'Éxito', 
        message: `Producto "${formData.nombre}" agregado correctamente.` 
      });
      // Reset form
      setFormData({ nombre: '', bodega: '', barra: '', stockMin: '', stockMax: '' });

    } catch (err) {
      showModal({ title: 'Error', message: 'Ocurrió un error al agregar el producto.' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="add-product-form-container">
      <h3>Agregar Nuevo Producto</h3>
      <div className="form-scroll-container">
        <form onSubmit={handleSubmit} className="add-product-form">
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre del Producto" required />
          <input type="number" name="bodega" value={formData.bodega} onChange={handleChange} placeholder="Cantidad en Bodega" />
          <input type="number" name="barra" value={formData.barra} onChange={handleChange} placeholder="Cantidad en Barra" />
          <input type="number" name="stockMin" value={formData.stockMin} onChange={handleChange} placeholder="Stock Mínimo" />
          <input type="number" name="stockMax" value={formData.stockMax} onChange={handleChange} placeholder="Stock Máximo" />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Agregando...' : 'Agregar Producto'}
          </button>
        </form>
      </div>
    </div>
    </>
  );
};

export default AddProductForm;