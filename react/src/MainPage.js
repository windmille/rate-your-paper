import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import './MainPage.css';
import './DoiPage.css';
import { queryMostRecentPaperCommentsResolver } from './graphql/queries';

const MainPage = () => {
  const [searchDoi, setSearchDoi] = useState('');
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryAttempted, setQueryAttempted] = useState(false);

  const client = generateClient();
  
  const handleSearch = () => {
    if (!searchDoi.trim()) return;
    navigate(`/doi?doi=${searchDoi}`);
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (queryAttempted) return;
      setQueryAttempted(true);

      try {
        const response = await client.graphql({
          query: queryMostRecentPaperCommentsResolver,
        });

        if (response.data && response.data.queryMostRecentPaperCommentsResolver) {
          setComments(response.data.queryMostRecentPaperCommentsResolver);
        } else {
          setComments([]);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (!queryAttempted) fetchComments();
  }, [client, queryAttempted]);

  return (
    <div>
      <div className="main-container">
        <h1 className="main-title">Search for Paper Comments</h1>
        <div className="search-box">
          <input
            type="text"
            value={searchDoi}
            onChange={(e) => setSearchDoi(e.target.value)}
            placeholder="Enter DOI (10.xxxx/yyyyy)"
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>
      </div>

      <div className="container">
        <h1 className="title">Recent Comments</h1>
        <div className="comments-section">
          {loading && <p>Loading comments...</p>}
          {error && <p className="error-message">Error loading comments: {error.message}</p>}
          {comments.length === 0 ? (
            <p className="no-comments">No comments available.</p>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="comment-card shaded-comment">
                <a 
                  href={`${window.location.origin}/doi?doi=${comment.doi}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="doi-link"
                >
                  {`${window.location.origin}/doi?doi=${comment.doi}`}
                </a>
                <p>
                  <span><strong>{comment.userName}</strong></span>
                  <span className="timestamp"> {new Date(comment.timestamp).toLocaleString()}</span>
                </p>
                <p>{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;
