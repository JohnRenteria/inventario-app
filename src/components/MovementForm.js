import React, { useState } from 'react';
import { collection, doc, updateDoc, increment, serverTimestamp, addDoc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../firesbase/config';
import { useAuth } from '../context/AuthContext';
import './MovementForm.css';
import { useModal } from '../context/ModalContext';

const MovementForm = ({ disabled }) => {
  const { userProfile, inventory } = useAuth(); // Usamos el inventario del contexto
  const { showModal } = useModal();
  const [productName, setProductName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementType, setMovementType] = useState('Ingreso a Bodega');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductNameChange = (e) => {
    const value = e.target.value;
    setProductName(value);
    setSelectedProduct(null); // Deseleccionar producto si se edita el nombre

    if (value.length > 0) {
      const filteredSuggestions = inventory.filter(product =>
        product.nombre.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const onSuggestionClick = (product) => {
    setProductName(product.nombre);
    setSelectedProduct(product);
    setSuggestions([]);
  };

  const checkAndAlertForLowStock = async (productId) => {
    try {
      // 1. Obtiene los datos más recientes del producto desde Firestore
      const productRef = doc(db, 'inventory', productId);
      const productSnap = await getDoc(productRef);
  
      if (productSnap.exists()) {
        const product = productSnap.data();
        const { nombre, total, stockMin } = product;
  
        // 2. Comprueba si el stock es bajo y si hay un mínimo definido
        if (stockMin > 0 && total <= stockMin) {
          // 3. Muestra la alerta usando el modal
          showModal({
            title: '⚠️ Alerta de Stock Bajo',
            message: `El producto "${nombre}" ha alcanzado el stock mínimo. Quedan solo ${total} unidades.`,
            type: 'warning', // Añadimos un tipo para identificar la alerta
          });
        }
      }
    } catch (error) {
      console.error("Error al verificar el stock del producto:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showModal({ title: 'Error', message: 'Debes seleccionar un producto de la lista.' });
      return;
    }
    if (!quantity || quantity <= 0) {
      showModal({ title: 'Error', message: 'La cantidad debe ser un número mayor a cero.' });
      return;
    }

    setIsSubmitting(true);

    const productRef = doc(db, 'inventory', selectedProduct.id);
    const qty = Number(quantity);
    const responsable = `${userProfile.nombre} ${userProfile.apellido}`;

    try {
      let updates = { responsable, lastUpdated: serverTimestamp() };
      let isSalida = false;

      switch (movementType) {
        case 'Ingreso a Bodega':
          updates.bodega = increment(qty);
          updates.ingreso = increment(qty);
          updates.total = increment(qty);
          break;
        case 'Ingreso a Barra': // Ingreso directo a Barra
          updates.barra = increment(qty);
          updates.ingreso = increment(qty);
          updates.total = increment(qty);
          break;
        case 'Bodega a Barra':
          if (selectedProduct.bodega < qty) throw new Error('No hay suficiente stock en bodega.');
          updates.bodega = increment(-qty);
          // Se registra como una salida de la bodega, pero el stock de la barra no cambia.
          // updates.salida = increment(qty); // No se registra como salida general
          // updates.total = increment(-qty); // El total no cambia, es un traspaso
          updates.barra = increment(qty);
          break;
        case 'Salida de Bodega':
          if (selectedProduct.bodega < qty) throw new Error('No hay suficiente stock en bodega.');
          updates.bodega = increment(-qty);
          updates.salida = increment(qty);
          updates.total = increment(-qty);
          isSalida = true;
          break;
        case 'Salida de Barra':
          if (selectedProduct.barra < qty) throw new Error('No hay suficiente stock en barra.');
          updates.barra = increment(-qty);
          updates.salida = increment(qty);
          updates.total = increment(-qty);
          isSalida = true;
          break;
        default:
          throw new Error('Tipo de movimiento no válido');
      }

      await updateDoc(productRef, updates);

      // Si es una salida, registrarla en el historial y en el reporte de ventas diario.
      if (isSalida) {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
        const dailyReportRef = doc(db, 'daily_sales', dateString);

        // Registrar movimiento en el historial
        await addDoc(collection(db, 'inventory_movements'), {
          productId: selectedProduct.id,
          productName: selectedProduct.nombre,
          type: movementType,
          quantity: qty,
          createdAt: serverTimestamp(),
        });

        // Actualizar el reporte de ventas diario de forma segura con una transacción
        await runTransaction(db, async (transaction) => {
          const dailyReportDoc = await transaction.get(dailyReportRef);
          const fieldPath = `products.${selectedProduct.id}`;
          if (!dailyReportDoc.exists()) {
            transaction.set(dailyReportRef, { date: new Date(dateString), products: { [selectedProduct.id]: { name: selectedProduct.nombre, quantity: qty } } });
          } else {
            transaction.update(dailyReportRef, { [`${fieldPath}.quantity`]: increment(qty), [`${fieldPath}.name`]: selectedProduct.nombre });
          }
        });

        // Ahora también llamamos a la función de alerta
        await checkAndAlertForLowStock(selectedProduct.id);
      }

      setProductName('');
      setSelectedProduct(null);
      setQuantity('');

    } catch (err) {
      showModal({ title: 'Error', message: err.message });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="movement-form-container">
      {disabled && (
        <div className="form-overlay">
          <p>El registro de movimientos está deshabilitado hasta la próxima revisión.</p>
        </div>
      )}
      <h3>Registrar Movimiento</h3>
      <form onSubmit={handleSubmit} className="movement-form">
        <div className="autocomplete-container">
          <input
            type="text"
            value={productName}
            onChange={handleProductNameChange}
            placeholder="Buscar producto..."
            autoComplete="off"
            disabled={disabled}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map(suggestion => (
                <li key={suggestion.id} onClick={() => onSuggestionClick(suggestion)}>
                  {suggestion.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select value={movementType} onChange={(e) => setMovementType(e.target.value)} disabled={disabled}>
          <option value="Ingreso a Bodega">Ingreso a Bodega</option>
          <option value="Ingreso a Barra">Ingreso a Barra</option>
          <option value="Bodega a Barra">Bodega a Barra</option>
          <option value="Salida de Barra">Salida de Barra</option>
          <option value="Salida de Bodega">Salida de Bodega</option>
        </select>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Cantidad"
          min="1"
          disabled={disabled}
        />
        <button type="submit" disabled={isSubmitting || disabled}>
          {isSubmitting ? 'Agregando...' : 'Agregar Movimiento'}
        </button>
      </form>
    </div>
  );
};

export default MovementForm;