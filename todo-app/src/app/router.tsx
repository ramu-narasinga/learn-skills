import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { paths } from '@/config/paths';

export const createAppRouter = () =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/todos'),
    },
  ]);

export const AppRouter = () => {
  const router = useMemo(() => createAppRouter(), []);
  return <RouterProvider router={router} />;
};
