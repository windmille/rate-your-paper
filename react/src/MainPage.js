import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
  const [doi, setDoi] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    // Navigate to /main/doi with DOI as query parameter
    navigate(`/doi?doi=${doi}`);
  };

  return (
    <div>
      <h1>Search for DOI Comments</h1>
      <input
        type="text"
        value={doi}
        onChange={(e) => setDoi(e.target.value)}
        placeholder="Enter DOI"
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default MainPage;
