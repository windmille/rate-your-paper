import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [doi, setDoi] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!doi.trim()) return;
    navigate(`/doi?doi=${doi}`);
  };

  return (
    <div className="main-container">
      <h1 className="main-title">Search for Paper Comments</h1>
      <div className="search-box">
        <input
          type="text"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          placeholder="Enter DOI (10.xxxx/yyyyy)"
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>
    </div>
  );
};

export default MainPage;
