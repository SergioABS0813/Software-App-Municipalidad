import PublicPortal from '../features/public-portal/PublicPortal';
import ValoracionEventoPage from '../pages/public/ValoracionEventoPage';

function App() {
  const { pathname } = window.location;

  if (pathname === '/satisfaccion/gracias') {
    return <ValoracionEventoPage view="thanks" />;
  }

  if (pathname.startsWith('/satisfaccion/') || pathname === '/valorar-evento') {
    return <ValoracionEventoPage />;
  }

  return <PublicPortal />;
}

export default App;