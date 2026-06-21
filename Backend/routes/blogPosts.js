import express from 'express';
import BlogPost from '../models/blogPost.js'; // Importa lo schema sopra
import uploadCloud from '../config/cloudinaryConfig.js';

const router = express.Router();

// 1. GET /blogPosts - Ottiene i post con paginazione
router.get('/', async (req, res) => {
  try {
    let queryFilter = {};
    if (req.query.title) {
      queryFilter.title = { $regex: req.query.title, $options: 'i' };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const totalPosts = await BlogPost.countDocuments(queryFilter);
    const results = await BlogPost.find(queryFilter)
      .skip(skipIndex)
      .limit(limit);

    res.status(200).json({
      blogPosts: results,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts: totalPosts
    });
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero dei blog post", error: error.message });
  }
});

// 2. GET /blogPosts/:id - Recupera un singolo post tramite ID
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post non trovato" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero del blog post", error: error.message });
  }
});

// 3. POST /blogPosts - Crea un nuovo post
router.post('/', async (req, res) => {
  try {
    const newPost = new BlogPost(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ message: "Errore nella creazione del blog post", error: error.message });
  }
});

// 4. PUT /blogPosts/:id - Modifica un post esistente
router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedPost) return res.status(404).json({ message: "Blog post non trovato" });
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: "Errore nell'aggiornamento del blog post", error: error.message });
  }
});

// 5. DELETE /blogPosts/:id - Elimina un post
router.delete('/:id', async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Blog post non trovato" });
    res.status(200).json({ message: "Blog post eliminato con successo" });
  } catch (error) {
    res.status(500).json({ message: "Errore nella cancellazione del blog post", error: error.message });
  }
});

// 6. PATCH /blogPosts/:blogPostId/cover - Upload della copertina su Cloudinary
router.patch('/:blogPostId/cover', uploadCloud.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Nessun file cover caricato" });

    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.blogPostId,
      { cover: req.file.path },
      { new: true }
    );
    if (!updatedPost) return res.status(404).json({ message: "Blog post non trovato" });

    res.status(200).json({ message: "Cover aggiornata con successo!", blogPost: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "Errore durante l'upload della cover", error: error.message });
  }
});

// =========================================================
// 💬 ENDPOINTS RICHIESTI PER I COMMENTI EMBEDDED
// =========================================================

// GET /blogPosts/:id/comments => ritorna tutti i commenti di uno specifico post
router.get('/:id/comments', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post non trovato" });
    res.status(200).json(post.comments || []);
  } catch (error) {
    res.status(500).json({ message: "Errore recupero commenti", error: error.message });
  }
});

// GET /blogPosts/:id/comments/:commentId => ritorna un commento specifico
router.get('/:id/comments/:commentId', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post non trovato" });
    
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Commento non trovato" });
    
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Errore recupero commento", error: error.message });
  }
});

// POST /blogPosts/:id => aggiungi un nuovo commento ad un post specifico
router.post('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post non trovato" });

    post.comments.push(req.body);
    await post.save();

    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (error) {
    res.status(400).json({ message: "Errore aggiunta commento", error: error.message });
  }
});

// PUT /blogPosts/:id/comment/:commentId => cambia un commento di un post specifico
router.put('/:id/comment/:commentId', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post non trovato" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Commento non trovato" });

    if (req.body.name) comment.name = req.body.name;
    if (req.body.email) comment.email = req.body.email;
    if (req.body.comment) comment.comment = req.body.comment;

    await post.save();
    res.status(200).json(comment);
  } catch (error) {
    res.status(400).json({ message: "Errore modifica commento", error: error.message });
  }
});

// DELETE /blogPosts/:id/comment/:commentId => elimina un commento specifico
router.delete('/:id/comment/:commentId', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post non trovato" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Commento non trovato" });

    comment.deleteOne();
    await post.save();

    res.status(200).json({ message: "Commento eliminato con successo" });
  } catch (error) {
    res.status(500).json({ message: "Errore cancellazione commento", error: error.message });
  }
});

export default router;