// Minimal toast service to allow non-React modules to trigger toasts
const ToastService = {
  _listeners: [],
  on(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  },
  show(type, message, duration = 3000) {
    this._listeners.forEach((l) => {
      try { l({ type, message, duration }); } catch (e) { /* ignore */ }
    });
  },
};

export default ToastService;
