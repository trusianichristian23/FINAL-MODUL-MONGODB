import 'dotenv/config'; // 👈 PRIMA RIGA ASSOLUTA: Carica il file .env prima di tutto il resto
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport'; 
import './config/passport.js'; // 👈 IMPORTANTE: Registra la strategia Google dentro Passport
import authorRoutes from './routes/authors.js';
import blogPostRoutes from './routes/blogPosts.js';
import { authMiddleware } from './routes/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors()); 
app.use(express.json()); 

// Inizializzazione di Passport
app.use(passport.initialize()); 

// Rotte degli autori
app.use('/authors', authorRoutes);

// Tutti gli endpoint dei blog post richiedono il Token valido
app.use('/blogPosts', authMiddleware, blogPostRoutes); 

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('💾 Connesso al database MongoDB con successo!');
    app.listen(PORT, () => {
      console.log(`🚀 Server locale avviato con successo sulla porta: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Errore di connessione al database:', err.message);
  });