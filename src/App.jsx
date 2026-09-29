import { useSelector } from 'react-redux';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const token = useSelector((s) => s.auth.token);
  return token ? <Dashboard /> : <Auth />;
}
