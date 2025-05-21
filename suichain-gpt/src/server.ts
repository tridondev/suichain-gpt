import express from 'express';
import portfolioRoutes from './routes/portfolioRoutes';

 // Adjust path as needed

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.use(express.json());
app.use('/portfolio', portfolioRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});