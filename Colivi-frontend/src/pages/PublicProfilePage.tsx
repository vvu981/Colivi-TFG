import React from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { PublicProfileView } from '../features/user/components/PublicProfileView';

/**
 * Public User Profile Page (/users/:id and /profile/:id).
 * Single Responsibility: Top-level page container providing layout context.
 */
export const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <MainLayout>
      <PublicProfileView userId={id} />
    </MainLayout>
  );
};

export default PublicProfilePage;
