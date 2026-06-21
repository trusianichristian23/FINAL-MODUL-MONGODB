import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Author from '../models/author.js';
import jwt from 'jsonwebtoken';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Cerchiamo se esiste già un autore con questo googleId o con la stessa email
        let author = await Author.findOne({ googleId: profile.id });

        if (!author) {
          author = await Author.findOne({ email: profile.emails[0].value });
        }

        // Se non esiste, lo creiamo prendendo i dati da Google
        if (!author) {
          author = new Author({
            googleId: profile.id,
            nome: profile.name.givenName || 'Google User',
            cognome: profile.name.familyName || 'User',
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            password: 'oauth_account_created_via_google_login', 
            dataDiNascita: '01/01/2000' 
          });
          await author.save();
        } else if (!author.googleId) {
          // Se l'utente esisteva già via registrazione classica (stessa email), colleghiamo il googleId
          author.googleId = profile.id;
          await author.save();
        }

        // Creiamo il token JWT per l'autore trovato o appena registrato
        const token = jwt.sign(
          { id: author._id, email: author.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Passiamo l'autore e il token al passaggio successivo
        return done(null, { author, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;