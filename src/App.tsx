import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DirectoryProvider } from './contexts/DirectoryContext';

function App() {
  return (
    <DirectoryProvider>
      <RouterProvider router={router} />
    </DirectoryProvider>
  );
}

export default App
