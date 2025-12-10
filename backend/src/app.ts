import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './services/auth/routes/auth.routes';
import { errorHandler } from './shared/middleware/error.middleware';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
