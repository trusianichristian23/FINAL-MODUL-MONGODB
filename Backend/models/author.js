import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const authorSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  cognome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: { 
    type: String,
    required: true
  },
  dataDiNascita: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  googleId: { // 👈 Aggiunto per tracciare l'accesso social
    type: String
  }
}, {
  timestamps: true 
});

// Metodo personalizzato per verificare la password durante il login
authorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Middleware Mongoose: Cripta automaticamente la password prima di salvare il record
authorSchema.pre('save', async function (next) {
  // Se la password non è modificata, saltiamo la cifratura (essenziale per OAuth!)
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export default model('Author', authorSchema);