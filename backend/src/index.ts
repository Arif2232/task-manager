import { createApp } from './app';
import { storageService } from './services/StorageService';

const PORT = process.env.PORT || 5001;

async function bootstrap() {
  try {
    await storageService.init();
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Todo Backend running at http://localhost:${PORT}`);
      console.log(`📝 Storage initialized at data/todos.json`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
