import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { addPaperComment } from './graphql/mutations';
import { queryPaperComments } from './graphql/queries';
import './MainPage.css';
import './DoiPage.css';

const DoiPage = () => {
  const [searchDoi, setSearchDoi] = useState('');
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingComment, setAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('Anonymous');
  const [queryAttempted, setQueryAttempted] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [doi, setDoi] = useState(queryParams.get('doi'));

  const client = generateClient();

  const handleSearch = () => {
    if (!searchDoi.trim()) return;
    setQueryAttempted(false);
    setDoi(searchDoi);
    navigate(`/doi?doi=${searchDoi}`);
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (queryAttempted) return;
      setQueryAttempted(true);

      try {
        const response = await client.graphql({
          query: queryPaperComments,
          variables: { doi },
        });

        if (response.data && response.data.queryPaperComments) {
          setComments(response.data.queryPaperComments);
        } else {
          setComments([]);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (doi && !queryAttempted) fetchComments();
  }, [doi, client]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);

    try {
      const response = await client.graphql({
        query: addPaperComment,
        variables: { doi, text: newComment, userName },
      });

      if (response.data && response.data.addPaperComment) {
        setComments([...comments, response.data.addPaperComment]);
        setNewComment('');
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setAddingComment(false);
    }
  };

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
        <button onClick={() => navigate('/')} className="home-button">
          Home
        </button>
      </div>
    </div>

      <div className="container">
        <h1 className="title">DOI</h1>
        {doi && (
          <a 
            href={`https://doi.org/${doi}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="doi-link"
          >
            {`https://doi.org/${doi}`}
          </a>
        )}

        <h1 className="title">Comments</h1>
        <div className="comments-section">
          {loading && <p>Loading comments...</p>}
          {error && <p className="error-message">Error loading comments: {error.message}</p>}
          {comments.length === 0 ? (
            <p className="no-comments">No comments available.</p>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="comment-card shaded-comment">
                <p>
                  <span><strong>{comment.userName}</strong></span>
                  <span className="timestamp"> {new Date(comment.timestamp).toLocaleString()}</span>
                </p>
                <p>{comment.text}</p>
              </div>
            ))
          )}
        </div>

        <h2>Add a Comment</h2>
        <input
          type="text"
          placeholder="Your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="input-field"
        />
        <textarea
          placeholder="Write your comment here..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="textarea-field"
        />
        <br />
        <button
          onClick={handleAddComment}
          disabled={addingComment}
          className={addingComment ? 'submit-button disabled' : 'submit-button'}
        >
          {addingComment ? 'Submitting...' : 'Submit Comment'}
        </button>
      </div>
    </div>
  );
};

export default DoiPage;
