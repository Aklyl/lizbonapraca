import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import logo from './zdjecie3.png';
import postsLogo from './zdjecie4.png';
import SnakeGame from './SnakeGame';

const API_BASE_URL = 'http://192.168.68.75:3001'; // Replace with your server's IP
 
function App() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]); // State for filtered posts
  const [newPost, setNewPost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // State for password
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('General'); // State for category
  const [customCategory, setCustomCategory] = useState(''); // State for custom category
  const [selectedCategory, setSelectedCategory] = useState('All'); // State for selected filter category
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [visitCount, setVisitCount] = useState(0);
 
  // Fetch posts from the backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/posts`) // Use the constant here
      .then((response) => response.json())
      .then((data) => {
        setPosts(data);
        setFilteredPosts(data); // Initialize filtered posts
      });
  }, []);
 
  useEffect(() => {
    const sessionVisited = sessionStorage.getItem('visited');
    if (!sessionVisited) {
      const storedCount = localStorage.getItem('visitCount');
      const newCount = storedCount ? parseInt(storedCount) + 1 : 1;
      localStorage.setItem('visitCount', newCount);
      setVisitCount(newCount);
      sessionStorage.setItem('visited', 'true'); // Mark the session as visited
    } else {
      const storedCount = localStorage.getItem('visitCount');
      setVisitCount(storedCount ? parseInt(storedCount) : 0);
    }
  }, []);
 
  useEffect(() => {
    // Fetch and update visit count from the backend
    fetch(`${API_BASE_URL}/api/visit-count`)
      .then((response) => response.json())
      .then((data) => {
        setVisitCount(data.visitCount); // Update the state with the visit count from the backend
      })
      .catch((error) => {
        console.error('Failed to fetch visit count:', error);
      });
  }, []);
 
  const handleDeletePost = (id) => {
    // Znajdź post, który ma zostać usunięty
    const postToDelete = posts.find((post) => post._id === id);
 
    // Sprawdź, czy zalogowany użytkownik jest właścicielem posta
    if (!postToDelete || postToDelete.user !== loggedInUser) {
      alert('You can only delete your own posts.');
      return;
    }
 
    // Usuń post, jeśli użytkownik jest właścicielem
    fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (response.ok) {
          const updatedPosts = posts.filter((post) => post._id !== id);
          setPosts(updatedPosts);
          setFilteredPosts(updatedPosts); // Zaktualizuj przefiltrowane posty
          alert('Post deleted successfully!');
        } else {
          alert('Failed to delete post');
        }
      })
      .catch(() => {
        alert('An error occurred while deleting the post');
      });
  };
 
  const handlePostSubmit = (e) => {
    e.preventDefault();
    const post = {
      text: newPost,
      user: loggedInUser || 'Anonymous', // Use "Anonymous" if no user is logged in
      date: new Date().toLocaleString(),
      image: image ? URL.createObjectURL(image) : null,
      category: category === 'Other' ? customCategory : category, // Use custom category if "Other" is selected
    };
 
    fetch(`${API_BASE_URL}/posts`, { // Use the constant here
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    })
      .then((response) => response.json())
      .then((savedPost) => {
        const updatedPosts = [...posts, savedPost];
        setPosts(updatedPosts);
        setFilteredPosts(updatedPosts); // Update filtered posts
        setNewPost('');
        setImage(null);
        setCategory('General'); // Reset category to default
        setCustomCategory(''); // Reset custom category
 
        // Show success alert
        alert('Post uploaded successfully!');
      })
      .catch(() => {
        // Show error alert
        alert('Post uploaded successfully!');
      });
  };
 
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };
 
  const handleCategoryFilterChange = (e) => {
    const selected = e.target.value;
    setSelectedCategory(selected);
 
    if (selected === 'All') {
      setFilteredPosts(posts); // Show all posts
    } else {
      setFilteredPosts(posts.filter((post) => post.category === selected)); // Filter posts by category
    }
  };
 
  const handleLogin = (e) => {
    e.preventDefault();
 
    // Prevent login if the username is empty or "Anonymous"
    if (!username.trim() || username.toLowerCase() === 'anonymous') {
      alert('Invalid username. Please enter a valid username.');
      return;
    }
 
    setLoggedInUser(username); // Set the logged-in user
    setUsername(''); // Clear the username input field
    setPassword(''); // Clear the password input field
  };
 
  const handleLogout = () => {
    setLoggedInUser(null); // Clear the logged-in user
    alert('You have been logged out!');
  };
 
  // Add this function to handle editing posts
  const handleEditPost = (id, updatedText, updatedCategory) => {
    const postToEdit = posts.find((post) => post._id === id);
 
    // Ensure the logged-in user is the owner of the post
    if (!postToEdit || postToEdit.user !== loggedInUser) {
      alert('You can only edit your own posts.');
      return;
    }
 
    const updatedPost = {
      ...postToEdit,
      text: updatedText,
      category: updatedCategory,
    };
 
    fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPost),
    })
      .then((response) => {
        if (response.ok) {
          const updatedPosts = posts.map((post) =>
            post._id === id ? updatedPost : post
          );
          setPosts(updatedPosts);
          setFilteredPosts(updatedPosts); // Update filtered posts
          alert('Post updated successfully!');
        } else {
          alert('Failed to update post');
        }
      })
      .catch(() => {
        alert('An error occurred while updating the post');
      });
  };
 
  const handleLikePost = (id) => {
    if (!loggedInUser) {
      alert('You must be logged in to like a post.');
      return;
    }
 
    const updatedPosts = posts.map((post) => {
      if (post._id === id) {
        const alreadyLiked = post.likedBy?.includes(loggedInUser);
 
        if (alreadyLiked) {
          // Usuń "like", jeśli użytkownik już polubił
          return {
            ...post,
            likes: post.likes - 1,
            likedBy: post.likedBy.filter((user) => user !== loggedInUser),
          };
        } else {
          // Dodaj "like", jeśli użytkownik jeszcze nie polubił
          return {
            ...post,
            likes: (post.likes || 0) + 1,
            likedBy: [...(post.likedBy || []), loggedInUser],
          };
        }
      }
      return post;
    });
 
    setPosts(updatedPosts);
    setFilteredPosts(updatedPosts);
 
    // Opcjonalnie: Wyślij aktualizację do backendu
    fetch(`${API_BASE_URL}/posts/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: loggedInUser }),
    }).catch(() => {
      alert('Failed to update like status.');
    });
  };
 
  const handleAddComment = (postId, commentText) => {
    if (!loggedInUser) {
      alert('You must be logged in to comment.');
      return;
    }
 
    const updatedPosts = posts.map((post) => {
      if (post._id === postId) {
        const newComment = {
          user: loggedInUser,
          text: commentText,
          date: new Date().toLocaleString(),
        };
        return { ...post, comments: [...(post.comments || []), newComment] };
      }
      return post;
    });
 
    setPosts(updatedPosts);
    setFilteredPosts(updatedPosts);
 
    // Opcjonalnie: Wyślij aktualizację do backendu
    fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: loggedInUser, text: commentText }),
    }).catch(() => {
      alert('Failed to add comment.');
    });
  };
 
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId], // Przełącz widoczność dla danego posta
    }));
  };
 
  return (
    <Router>
      <div className="App">
 
        {/* Navigation */}
        <nav className="navbar">
          <div className="site-title">
            <img src={logo} alt="TTC Wired Logo" style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/add-post">Add Post</Link>
            <Link to="/about">About</Link>
            <Link to="/snake">Play Snake</Link> {/* Nowa zakładka */}
            {!loggedInUser ? (
              <Link to="/login">Login</Link>
            ) : (
              <>
                <span className="navbar-username">Welcome, {loggedInUser}!</span>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
 
        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <div className="section">
                <div className="posts-logo">
                  <img src={postsLogo} alt="Posts Logo" style={{ width: '200px', height: 'auto' }} />
                </div>
                <div className="filter">
                  <label htmlFor="categoryFilter">Filter by category: </label>
                  <select
                    id="categoryFilter"
                    value={selectedCategory}
                    onChange={handleCategoryFilterChange}
                  >
                    <option value="All">All</option>
                    <option value="General">General</option>
                    <option value="Technology">Technology</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => (
                    <div key={index} className="post">
                      <div className="post-header">
                        <p>
                          <strong>{post.user}</strong> - <span className="category">{post.category}</span>
                        </p>
                        <p className="date">{post.date}</p>
                      </div>
                      <div className="post-content">
                        <p>{post.text}</p>
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post"
                            className="post-image"
                          />
                        )}
                        <div className="post-actions">
                          <button
                            className="like-button"
                            onClick={() => handleLikePost(post._id)}
                          >
                            {post.likedBy?.includes(loggedInUser) ? 'Unlike 💔' : 'Like ❤️'}
                          </button>
                          <span>{post.likes || 0} Likes</span>
                        </div>
                        {post.user === loggedInUser && (
                          <button
                            className="delete-button"
                            onClick={() => handleDeletePost(post._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <div className="post-comments">
                        <h4 onClick={() => toggleComments(post._id)} style={{ cursor: 'pointer' }}>
                          Comments ({post.comments ? post.comments.length : 0}) {expandedComments[post._id] ? '▲' : '▼'}
                        </h4>
                        {expandedComments[post._id] && ( // Wyświetl komentarze tylko, jeśli są rozwinięte
                          <>
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map((comment, idx) => (
                                <div key={idx} className="comment">
                                  <p>
                                    <strong>{comment.user}</strong> ({comment.date}): {comment.text}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p>No comments yet. Be the first to comment!</p>
                            )}
                            {loggedInUser && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const commentText = e.target.elements.commentText.value;
                                  handleAddComment(post._id, commentText);
                                  e.target.reset();
                                }}
                              >
                                <input
                                  type="text"
                                  name="commentText"
                                  placeholder="Write a comment..."
                                  required
                                />
                                <button type="submit">Add Comment</button>
                              </form>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No posts yet. Be the first to post!</p>
                )}
              </div>
            }
          />
          <Route
            path="/add-post"
            element={
              <div className="section">
                <form onSubmit={handlePostSubmit}>
                  <input
                    type="text"
                    value={loggedInUser || 'Anonymous'} // Show "Anonymous" if no user is logged in
                    placeholder="Your username"
                    readOnly // Make the field read-only
                  />
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Write something..."
                    rows="4"
                  ></textarea>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Technology">Technology</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                  {category === 'Other' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <button type="submit">Post</button>
                </form>
              </div>
            }
          />
          <Route
            path="/about"
            element={
              <div className="section about-page">
                <h2>About Us</h2>
                <p>
                  Welcome to <strong>TTC Wired</strong>, your go-to platform for sharing and discovering amazing content!
                  Our mission is to create a space where users can express their thoughts, share ideas, and connect with others.
                </p>
                <h3>What We Offer</h3>
                <ul>
                  <li>Post your thoughts, ideas, and experiences.</li>
                  <li>Engage with others through likes and comments.</li>
                  <li>Filter posts by categories to find content that interests you.</li>
                </ul>
                <h3>Our Vision</h3>
                <p>
                  At TTC Wired, we believe in the power of community and creativity.
                  Our goal is to provide a platform where everyone feels welcome to share their voice and connect with like-minded individuals.
                </p>
                <h3>Contact Us</h3>
                <p>
                  Have questions or feedback? Feel free to reach out to us at <a href="mailto:support@ttcwired.com">support@ttcwired.com</a>.
                </p>
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <form onSubmit={handleLogin} className="login-form">
                <h2>Login</h2>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Login</button>
              </form>
            }
          />
          <Route path="/snake" element={<SnakeGame />} /> {/* Nowa trasa */}
        </Routes>
 
        {/* Footer */}
        <footer className="section">
          <p>&copy; 2025 My Blog. All rights reserved.</p>
          <p>
            Follow us on:<br />
            <a href="https://technikumcyfrowe.pl/" target="_blank" rel="noopener noreferrer"> Strona Internetowa</a><br />
            <a href="https://www.facebook.com/TTCSzczecin/?locale=pl_PL" target="_blank" rel="noopener noreferrer"> Facebook</a><br />
            <a href="https://www.instagram.com/ttc.su/" target="_blank" rel="noopener noreferrer"> Instagram</a><br />
          </p>
         
        </footer>
      </div>
    </Router>
  );
}
export default App;