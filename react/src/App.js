import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './MainPage';
import DoiPage from './DoiPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="" element={<MainPage />} />
        <Route path="/doi" element={<DoiPage />} />
      </Routes>
    </Router>
  );
}

export default App;
