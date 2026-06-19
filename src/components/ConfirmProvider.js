import React, { useState, createContext, useContext } from 'react';
import './ConfirmProvider.css';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

export const ConfirmProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState({ message: '' });
  const [resolver, setResolver] = useState(null);

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setOpts({ message });
      setOpen(true);
      setResolver(() => resolve);
    });
  };

  const handleClose = (answer) => {
    setOpen(false);
    if (resolver) resolver(answer);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      {open && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-message">{opts.message}</div>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-cancel" onClick={() => handleClose(false)}>Cancel</button>
              <button className="confirm-btn confirm-ok" onClick={() => handleClose(true)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
