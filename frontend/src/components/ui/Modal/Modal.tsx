// frontend/src/components/ui/Modal/Modal.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';
import Button from '../Button/Button'; // Optional: for styled buttons in footer

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode; // Optional: to render buttons or other content in footer
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footerContent }) => {
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Create a portal to render the modal outside the main app DOM tree
  // This is good for accessibility and stacking contexts
  const modalRoot = document.getElementById('root'); // Or a dedicated modal root element

  if (!modalRoot) {
    console.error("Modal root element not found. Make sure you have an element with id 'root' or a dedicated modal root.");
    return null; // Or render inline if portal root is not found, though less ideal
  }

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
        <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">&times;</button>
        
        {title && (
          <div className={styles.modalHeader}>
            <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>
          </div>
        )}
        
        <div className={styles.modalBody}>
          {children}
        </div>
        
        {footerContent && (
          <div className={styles.modalFooter}>
            {footerContent}
          </div>
        )}
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;