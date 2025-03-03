import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { addPaperComment } from './graphql/mutations';
import { queryPaperComments } from './graphql/queries';

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

  const client = generateClient(); // Initialize the GraphQL client

  useEffect(() => {
    const fetchComments = async () => {
      if (queryAttempted) return; // Prevent retrying if the query has already failed
      setQueryAttempted(true); // Mark that the query is being attempted

      try {
        const response = await client.graphql({
          query: queryPaperComments,
          variables: { doi },
        });
  
        if (response.data && response.data.queryPaperComments) {
          setComments(response.data.queryPaperComments); // Set comments in state
        } else {
          setComments([]); // Ensure empty array if no data returned
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
  
    if (doi && !queryAttempted) fetchComments();
  }, [doi, client, queryAttempted]);

  if (loading) return <p>Loading comments...</p>;
  if (error) return <p>Error loading comments: {error.message}</p>;

  const handleAddComment = async () => {
    if (!newComment.trim()) return; // Prevent empty submissions
    setAddingComment(true);

    try {
      const response = await client.graphql({
        query: addPaperComment,
        variables: { doi, text: newComment, userName },
      });

      if (response.data && response.data.addPaperComment) {
        setComments([...comments, response.data.addPaperComment]); // Append new comment
        setNewComment(''); // Reset input field
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setAddingComment(false);
    }
  };


  return (
    <div>
      <h1>DOI Link</h1>
      {doi && (
        <a 
          href={`https://doi.org/${doi}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'block', marginBottom: '20px', fontSize: '18px', color: 'blue', textDecoration: 'underline' }}
        >
          {`https://doi.org/${doi}`}
        </a>
      )}

      <h1>Comments</h1>
      <div>
        {comments.length === 0 ? (
          <p>No comments available.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.timestamp} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
              <p><strong>Name:</strong> {comment.userName}</p>
              <p><strong>DOI:</strong> {comment.doi}</p>
              <p><strong>Comment:</strong> {comment.text}</p>
              <p><strong>Timestamp:</strong> {new Date(comment.timestamp).toLocaleString()}</p>
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
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <textarea
        placeholder="Write your comment here..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        style={{ width: '100%', height: '80px', marginBottom: '10px' }}
      />
      <br />
      <button onClick={handleAddComment} disabled={addingComment}>
        {addingComment ? 'Submitting...' : 'Submit Comment'}
      </button>

    </div>
  );
};

export default DoiPage;
