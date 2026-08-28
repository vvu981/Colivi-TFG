import React from 'react';
import { ReceivedRequests } from '../features/housing/components/ReceivedRequests';
import { MainLayout } from '../layouts/MainLayout';

export const ReceivedRequestsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <ReceivedRequests />
      </div>
    </MainLayout>
  );
};
