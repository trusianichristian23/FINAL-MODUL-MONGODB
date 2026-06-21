import { Schema, model } from 'mongoose';

// Schema secondario per i commenti (verrà incorporato nel post)
const commentSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  comment: { type: String, required: true }
}, {
  timestamps: true
});

// Schema principale del Blog Post
const blogPostSchema = new Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  cover: { type: String, required: true },
  readTime: {
    value: { type: Number, required: true },
    unit: { type: String, required: true }
  },
  author: { type: String, required: true }, 
  content: { type: String, required: true },
  comments: [commentSchema] // 👇 Array di commenti embedded richiesto dal compito
}, {
  timestamps: true
});

// Colleghiamo il modello alla collezione esatta del tuo file .env ('blogposts')
export default model('BlogPost', blogPostSchema, 'blogposts');