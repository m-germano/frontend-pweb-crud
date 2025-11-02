import { useEffect, useMemo, useState } from 'react';
import { ToastContainer, type ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Theme = NonNullable<ToastOptions['theme']>; // 'light' | 'dark' | 'colored' | 'auto' (depende da versão)

function useDarkClassTheme(): Theme {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;

    // Observa adição/remoção da classe 'dark' no <html>
    const obs = new MutationObserver(() => {
      setIsDark(el.classList.contains('dark'));
    });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark ? 'dark' : 'light';
}

export default function ToastifyContainer() {
  const theme = useDarkClassTheme();

  // Dica: para manter visual consistente no dark, evite 'colored'
  const containerProps = useMemo<ToastOptions>(
    () => ({
      theme,
      position: 'top-right',
      newestOnTop: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      autoClose: 2800,
    }),
    [theme]
  );

  return <ToastContainer {...containerProps} />;
}
