import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../auth';
import { reportService } from '../services/reportService';
import type { ReportFeedbackResponse } from '../types/report.types';
import { ReportFeedbackModal } from './ReportFeedbackModal';

export const ReportFeedbackListener: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [feedbacks, setFeedbacks] = useState<ReportFeedbackResponse[]>([]);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkPendingFeedback = async () => {
      if (!isAuthenticated || isCheckingRef.current) return;
      try {
        isCheckingRef.current = true;
        const data = await reportService.getPendingFeedback();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setFeedbacks(data);
        }
      } catch (error) {
        // Silently fail if feedback endpoint has network or auth error
        console.error('Error fetching report feedback:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    if (isAuthenticated) {
      checkPendingFeedback();
    } else {
      setFeedbacks([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const currentFeedback = feedbacks.length > 0 ? feedbacks[0] : null;

  const handleClose = useCallback(async () => {
    if (!currentFeedback) return;
    const currentId = currentFeedback.id;

    // Optimistically advance to next feedback or close modal
    setFeedbacks((prev) => prev.filter((f) => f.id !== currentId));

    try {
      await reportService.acknowledgeFeedback(currentId);
    } catch (error) {
      console.error('Error acknowledging report feedback:', error);
    }
  }, [currentFeedback]);

  if (!currentFeedback) return null;

  return (
    <ReportFeedbackModal
      isOpen={!!currentFeedback}
      onClose={handleClose}
      feedback={currentFeedback}
    />
  );
};
