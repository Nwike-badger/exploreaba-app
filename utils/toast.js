import Toast from 'react-native-toast-message';

const baseShow = (type, message, opts = {}) => {
  const text = opts.icon ? `${opts.icon} ${message}` : message;
  Toast.show({
    type,
    text1: text,
    visibilityTime: opts.duration || (type === 'error' ? 4000 : 3000),
  });
};

const toast = (message, opts = {}) => baseShow(opts.type || 'info', message, opts);
toast.success = (msg, opts) => baseShow('success', msg, opts);
toast.error   = (msg, opts) => baseShow('error',   msg, opts);
toast.info    = (msg, opts) => baseShow('info',    msg, opts);

export { toast };