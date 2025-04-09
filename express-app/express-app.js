const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // Import ObjectId to handle MongoDB IDs
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Added for JWT authentication

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB Connection (MongoClient)
const uri = "mongodb+srv://anielaujaworska:Haniajaworska10.@cluster0.8e5aype.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let postsCollection;



async function connectToDB() {
  try {
    await client.connect();
    const database = client.db('blogDB'); // Database name
    postsCollection = database.collection('posts'); // Collection name
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}
connectToDB();

// MongoDB Connection (Mongoose)
mongoose
  .connect('mongodb://127.0.0.1:27017/myblog', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB via Mongoose'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10); // Hash password before saving
  next();
});




const User = mongoose.model('User', userSchema);

// Routes
app.get('/ping', (req, res) => {
  res.send('Pong! Backend is working.');
});

// User Authentication Routes
// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send({ error: 'Username already exists' });
    } else {
      res.status(500).send({ error: 'Internal server error' });
    }
  }
});




// Login a user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send({ error: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).send({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ token, username });
  } catch (error) {
    res.status(500).send({ error: 'Internal server error' });
  }
});



// Get all posts
app.get('/posts', async (req, res) => {
  const posts = await postsCollection.find().toArray();
  res.json(posts);
});

// Add a new post
app.post('/posts', async (req, res) => {
  const newPost = req.body;
  const result = await postsCollection.insertOne(newPost);
  res.status(201).json(result.ops[0]);
});

// Delete a post by ID
app.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;

  try {
    const result = await postsCollection.deleteOne({ _id: new ObjectId(postId) });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Like a post by ID
app.post('/posts/:id/like', async (req, res) => {
  const postId = req.params.id;
  const { user } = req.body;

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    const alreadyLiked = post.likedBy?.includes(user);

    if (alreadyLiked) {
      // Usuń "like"
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        {
          $inc: { likes: -1 },
          $pull: { likedBy: user },
        }
      );
      res.status(200).send('Like removed');
    } else {
      // Dodaj "like"
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        {
          $inc: { likes: 1 },
          $push: { likedBy: user },
        }
      );
      res.status(200).send('Like added');
    }
  } catch (error) {
    console.error('Error updating likes:', error);
    res.status(500).send('Internal server error');
  }
});

// Add a comment to a post by ID
app.post('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const { user, text } = req.body;

  const newComment = {
    user,
    text,
    date: new Date().toLocaleString(),
  };

  try {
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) }, // Znajdź post po ID
      { $push: { comments: newComment } } // Dodaj nowy komentarz do tablicy "comments"
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});

const upload = multer({ storage: storage });
// Backend route for updating a post
app.put('/posts/:id', (req, res) => {
  const { id } = req.params;
  const updatedPost = req.body;

  Post.findByIdAndUpdate(id, updatedPost, { new: true }, (err, post) => {
    if (err) {
      res.status(500).send('Error updating post');
    } else if (!post) {
      res.status(404).send('Post not found');
    } else {
      res.json(post);
    }
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Handle post creation with file upload
app.post('/upload-post', upload.single('image'), (req, res) => {
  const newPost = {
    text: req.body.text,
    user: req.body.user,
    date: req.body.date,
    image: req.file ? req.file.path : null,
  };

  // Save newPost to your database here

  res.json(newPost);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
