import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './features/auth';
import { ReportFeedbackListener } from './features/report/components/ReportFeedbackListener';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ReportFeedbackListener />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

