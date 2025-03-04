import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { addPaperComment } from './graphql/mutations';
import { queryPaperComments } from './graphql/queries';
import './DoiPage.css';

const DoiPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingComment, setAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('Anonymous');
  const [queryAttempted, setQueryAttempted] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const doi = queryParams.get('doi');

  const client = generateClient();

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
  }, [doi, client, queryAttempted]);

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
    <div className="container">
      <h1 className="title">DOI Link</h1>
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
              <p><strong>User:</strong> {comment.userName}</p>
              <p className="timestamp"><strong>At:</strong> {new Date(comment.timestamp).toLocaleString()}</p>
              <p><strong>Comment:</strong> {comment.text}</p>
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
  );
};

export default DoiPage;
