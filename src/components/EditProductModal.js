import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firesbase/config';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal'; // Reutilizaremos el componente Modal
import { useModal } from '../context/ModalContext';

const EditProductModal = ({ product, isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { showModal } = useModal();
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Cuando el producto cambie, actualizamos el estado del formulario
    if (product) {
      setFormData({
        nombre: product.nombre || '',
        bodega: product.bodega || 0,
        barra: product.barra || 0,
        stockMin: product.stockMin || 0,
        stockMax: product.stockMax || 0,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: name === 'nombre' ? value : Number(value),
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    const productRef = doc(db, 'inventory', product.id);

    try {
      const total = formData.bodega + formData.barra;
      await updateDoc(productRef, {
        ...formData,
        total: total,
        responsable: `${userProfile.nombre} ${userProfile.apellido}`,
        lastUpdated: serverTimestamp(),
      });
      onClose(); // Cierra el modal después de guardar
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      showModal({ title: 'Error', message: 'Ocurrió un error al guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar: ${product?.nombre}`}>
      <form className="edit-product-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Bodega</label>
          <input type="number" name="bodega" value={formData.bodega || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Barra</label>
          <input type="number" name="barra" value={formData.barra || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Stock Mínimo</label>
          <input type="number" name="stockMin" value={formData.stockMin || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Stock Máximo</label>
          <input type="number" name="stockMax" value={formData.stockMax || ''} onChange={handleChange} />
        </div>

        <div className="edit-modal-actions">
          <button type="button" onClick={onClose} className="cancel-button">Cancelar</button>
          <button type="submit" className="save-button" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;