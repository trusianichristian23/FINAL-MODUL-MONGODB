import jwt from 'jsonwebtoken';
import Author from '../models/author.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Controlla se l'header di autorizzazione è presente
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Accesso negato. Token mancante o non valido." });
    }

    // 2. Estrae il token pulito
    const token = authHeader.split(' ')[1];

    // 3. Verifica la firma del token con il JWT_SECRET del tuo file .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Cerca l'autore nel DB escludendo la password per sicurezza
    const author = await Author.findById(decoded.id).select('-password');
    if (!author) {
      return res.status(401).json({ message: "Autore non trovato." });
    }

    // 5. Inietta l'autore nella richiesta corrente per renderlo accessibile alle rotte successive
    req.author = author;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token scaduto o non valido." });
  }
};