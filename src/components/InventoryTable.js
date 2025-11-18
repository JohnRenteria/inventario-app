import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firesbase/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import MovementForm from './MovementForm';
import AddProductForm from './AddProductForm';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import SaveReportModal from './SaveReportModal';
import DownloadModal from './DownloadModal';
import './InventoryTable.css';

const InventoryTable = () => {
  const { userProfile, inventory, loading, isInventoryLocked } = useAuth();
  const { showModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProductId, setEditingProductId] = useState(null); // ID del producto en edición
  const [editFormData, setEditFormData] = useState({}); // Datos del formulario de edición
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const itemsPerPage = 10;
  const [sortedInventory, setSortedInventory] = useState([]);

  useEffect(() => {
    // Ordenamos el inventario cuando cambia
    const sorted = [...inventory].sort((a, b) => a.nombre.localeCompare(b.nombre));
    setSortedInventory(sorted);
  }, [inventory]);

  useEffect(() => {
    // Reinicia a la primera página cada vez que se realiza una búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setEditFormData({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const handleSaveEdit = async (productId) => {
    const productRef = doc(db, 'inventory', productId);
    const total = (editFormData.bodega || 0) + (editFormData.barra || 0);

    try {
      await updateDoc(productRef, {
        nombre: editFormData.nombre,
        bodega: editFormData.bodega,
        barra: editFormData.barra,
        stockMin: editFormData.stockMin,
        stockMax: editFormData.stockMax,
        total: total,
        responsable: `${userProfile.nombre} ${userProfile.apellido}`,
        lastUpdated: serverTimestamp(),
      });
      setEditingProductId(null); // Salir del modo edición
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      showModal({ title: 'Error', message: 'No se pudieron guardar los cambios.' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const isNumberField = name !== 'nombre';
    const newValue = isNumberField ? (value === '' ? '' : Number(value)) : value;

    setEditFormData(prevData => ({ ...prevData, [name]: newValue }));
  };

  // Recalculamos el total en el estado de edición para que se vea en tiempo real
  const editingTotal = (editFormData.bodega || 0) + (editFormData.barra || 0);

  const handleDelete = async (id) => {
    showModal({
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar este producto?',
      type: 'confirm',
      onConfirm: async () => {
        const productDoc = doc(db, 'inventory', id);
        await deleteDoc(productDoc);
        console.log(`Producto con id ${id} eliminado`);
        showModal({ title: 'Éxito', message: 'Producto eliminado correctamente.' });
      },
    });
  };

  const handleReviewComplete = async () => {
    showModal({
      title: 'Confirmar Revisión',
      message: '¿Estás seguro de marcar como revisado? Esto reiniciará los contadores de Ingreso/Salida y habilitará los movimientos.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          inventory.forEach(product => {
            const productRef = doc(db, 'inventory', product.id);
            batch.update(productRef, { ingreso: 0, salida: 0 });
          });
          const statusRef = doc(db, 'app_status', 'inventoryLock');
          batch.set(statusRef, { isLocked: false }, { merge: true });
          await batch.commit();
          showModal({ title: 'Éxito', message: 'Inventario revisado. Los contadores se han reiniciado y los movimientos están habilitados.' });
        } catch (error) {
          console.error("Error al completar la revisión:", error);
          showModal({ title: 'Error', message: 'No se pudo completar la revisión.' });
        }
      },
    });
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const date = new Date();
    const formattedDate = date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const responsable = `${userProfile.nombre} ${userProfile.apellido}`;

    // Título
    doc.setFontSize(18);
    doc.text("Reporte de Inventario - Al Aire Rooftop", 14, 22);

    // Subtítulos con información de descarga
    doc.setFontSize(10);
    doc.setTextColor(100); // Un color de texto más suave
    doc.text(`Descargado por: ${responsable}`, 14, 30);
    doc.text(`Fecha de descarga: ${formattedDate}`, 14, 35);

    autoTable(doc, {
      head: [['Nombre', 'Bodega', 'Ingreso', 'Salida', 'Barra', 'Total', 'Stock Mín.', 'Stock Máx.']],
      body: sortedInventory.map(item => [
        item.nombre, item.bodega || 0, item.ingreso || 0, item.salida || 0,
        item.barra || 0, item.total || 0, item.stockMin || 0, item.stockMax || 0,
      ]),
      startY: 40, // Ajustamos la posición para que no se solape con los nuevos textos
      theme: 'striped',
      headStyles: { fillColor: [34, 34, 34] },
    });
    doc.save(`inventario-al-aire-${date.toISOString().slice(0, 10)}.pdf`);
    setIsDownloadModalOpen(false);
  };

  const handleDownloadImage = () => {
    const elementToCapture = document.getElementById('capture-container');
    if (!elementToCapture) return;

    html2canvas(elementToCapture, {
      scale: 2, // Aumenta la resolución de la imagen
      useCORS: true,
    }).then(canvas => {
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.download = `inventario-al-aire-${date}.png`;
      link.href = image;
      link.click();
    });
    setIsDownloadModalOpen(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Fecha no disponible';
    const date = timestamp.toDate();
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <p>Cargando inventario...</p>;
  }

  // Lógica de búsqueda y paginación
  const filteredInventory = sortedInventory.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Verificamos si el usuario tiene el rol permitido para revisar
  const canReview = userProfile && ['Jefe de Barra', 'Administradora'].includes(userProfile.rol);
  // Permisos para los formularios y botones
  const canRegisterMovement = userProfile && ['Administradora', 'Jefe de Barra', 'Bartender'].includes(userProfile.rol);
  const canAddProduct = userProfile && ['Administradora', 'Jefe de Barra'].includes(userProfile.rol);
  const canSave = userProfile && ['Bartender', 'Jefe de Barra', 'Administradora'].includes(userProfile.rol);
  const canEdit = userProfile && ['Jefe de Barra', 'Administradora'].includes(userProfile.rol);
  const canDelete = userProfile && ['Jefe de Barra', 'Administradora'].includes(userProfile.rol);
  const canDownload = userProfile && userProfile.rol !== 'Bartender';


  return (
    <>
      <SaveReportModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        inventory={inventory}
        user={userProfile}
      />
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownloadAsPdf={handleDownloadPdf}
        onDownloadAsImage={handleDownloadImage}
      />
      <div className="inventario-container">
        <header className="inventario-header">
          <h3>Inventario</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </header>

        <div className="tabla-scroll-container">
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Bodega</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Barra</th>
                <th>Total</th>
                <th>Stock Mín.</th>
                <th>Stock Máx.</th>
                <th>Responsable</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                editingProductId === item.id ? (
                  // Fila en modo edición
                  <tr key={item.id} className="editing-row">
                    <td><input type="text" name="nombre" value={editFormData.nombre} onChange={handleFormChange} /></td>
                    <td><input type="number" name="bodega" value={editFormData.bodega} onChange={handleFormChange} /></td>
                    <td>{item.ingreso || 0}</td>
                    <td>{item.salida || 0}</td>
                    <td><input type="number" name="barra" value={editFormData.barra} onChange={handleFormChange} /></td>
                    <td>{editingTotal}</td>
                    <td><input type="number" name="stockMin" value={editFormData.stockMin} onChange={handleFormChange} /></td>
                    <td><input type="number" name="stockMax" value={editFormData.stockMax} onChange={handleFormChange} /></td>
                    <td>...</td>
                    <td className="actions-cell">
                      <button onClick={() => handleSaveEdit(item.id)} className="action-button save-inline-button">💾</button>
                      <button onClick={handleCancelEdit} className="action-button cancel-inline-button">❌</button>
                    </td>
                  </tr>
                ) : (
                  // Fila en modo lectura
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.bodega || 0}</td>
                    <td>{item.ingreso || 0}</td>
                    <td>{item.salida || 0}</td>
                    <td>{item.barra || 0}</td>
                    <td>{item.total || 0}</td>
                    <td>{item.stockMin || 0}</td>
                    <td>{item.stockMax || 0}</td>
                    <td><div>{item.responsable || 'N/A'}</div><div className="timestamp-cell">{formatTimestamp(item.lastUpdated)}</div></td>
                    <td className="actions-cell">
                      {canEdit && <button onClick={() => handleEditClick(item)} className="action-button edit-button">✏️</button>}
                      {canDelete && <button onClick={() => handleDelete(item.id)} className="action-button delete-button">🗑️</button>}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        <footer className="inventario-footer">
          <div className="pagination">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
              Siguiente
            </button>
          </div>
          <div className="review-button-container">
            {canDownload && <button onClick={() => setIsDownloadModalOpen(true)} className="download-button">Descargar</button>}
            {canSave && <button onClick={() => setIsSaveModalOpen(true)} className="save-button" disabled={isInventoryLocked}>Guardar</button>}
            {canReview && <button onClick={handleReviewComplete} className="review-button" disabled={!isInventoryLocked}>Revisado</button>}
          </div>
        </footer>
      </div>
      {canRegisterMovement && <MovementForm disabled={isInventoryLocked} />}
      {canAddProduct && <AddProductForm />}

      {/* Tabla oculta para la captura de imagen con todos los productos */}
      <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }}>
        <div id="capture-container" style={{ padding: '20px', backgroundColor: 'white', width: '1200px' }}>
          <h2 style={{ textAlign: 'center', color: '#333' }}>Reporte de Inventario - Al Aire Rooftop</h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '-10px' }}>
            Descargado por: {userProfile.nombre} {userProfile.apellido}
          </p>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '-10px', marginBottom: '25px' }}>
            Fecha de descarga: {new Date().toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Bodega</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Barra</th>
                <th>Total</th>
                <th>Stock Mín.</th>
                <th>Stock Máx.</th>
              </tr>
            </thead>
            <tbody>
              {sortedInventory.map((item) => (
                <tr key={`capture-${item.id}`}>
                  <td>{item.nombre}</td>
                  <td>{item.bodega || 0}</td>
                  <td>{item.ingreso || 0}</td>
                  <td>{item.salida || 0}</td>
                  <td>{item.barra || 0}</td>
                  <td>{item.total || 0}</td>
                  <td>{item.stockMin || 0}</td>
                  <td>{item.stockMax || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default InventoryTable;