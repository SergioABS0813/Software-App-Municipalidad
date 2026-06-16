import PublicPortal from '../features/public-portal/PublicPortal';
import ValoracionEventoPage from '../pages/public/ValoracionEventoPage';

function App() {
  if (window.location.pathname === '/valorar-evento') {
    return <ValoracionEventoPage />;
  }

  return <PublicPortal />;
}

export default App;
