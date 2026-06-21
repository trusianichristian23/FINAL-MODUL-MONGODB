import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Author from '../models/author.js';
import passport from '../config/passport.js'; // 👈 Importiamo la configurazione di passport

const router = express.Router();

// 🔒 MIDDLEWARE DI AUTENTICAZIONE JWT
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token mancante o non valido.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Sessione scaduta o Token alterato.' });
    }
};

// 🌐 ROTTE GOOGLE OAUTH
// Questa rotta viene chiamata quando l'utente clicca "Accedi con Google"
router.get('/googleLogin', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Questa è la rotta di callback dove Google rimanda l'utente dopo l'autenticazione
router.get('/googleCallback', 
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    // req.user contiene l'oggetto ritornato dal done() in passport.js { author, token }
    const token = req.user.token;
    
    // Rileva in automatico se siamo online su Render (production) o sul tuo PC locale
    const FRONTEND_URL = process.env.NODE_ENV === 'production'
      ? 'https://final-modulo-mongodb-frontend.vercel.app' 
      : 'http://localhost:5500';

    // Reindirizziamo il browser al frontend corretto passando il token nell'URL
    res.redirect(`${FRONTEND_URL}/index.html?token=${token}`);
  }
);

// 1. GET /authors -> Ritorna la lista per il frontend
router.get('/', async (req, res) => {
    try {
        const allAuthors = await Author.find({});
        res.json({ authors: allAuthors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. POST /authors -> Registrazione con password criptata
router.post('/', async (req, res) => {
    try {
        const { nome, cognome, email, password, dataDiNascita, avatar } = req.body;

        const existingAuthor = await Author.findOne({ email });
        if (existingAuthor) {
            return res.status(400).json({ message: 'Questa email è già registrata.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAuthor = new Author({
            nome,
            cognome,
            email,
            password: hashedPassword,
            dataDiNascita,
            avatar
        });

        await newAuthor.save();
        res.status(201).json(newAuthor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 3. POST /authors/login -> Effettua il login classico e restituisce il token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const author = await Author.findOne({ email });

        if (!author) {
            return res.status(404).json({ message: 'Autore non trovato.' });
        }

        const isMatch = await bcrypt.compare(password, author.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password errata.' });
        }

        const token = jwt.sign(
            { id: author._id, email: author.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. GET /authors/me -> Profilo protetto dell'utente autenticato
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const author = await Author.findById(req.user.id).select('-password');
        res.json(author);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;