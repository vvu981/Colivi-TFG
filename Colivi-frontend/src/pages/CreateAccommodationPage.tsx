import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Image } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { AccommodationForm } from '../features/housing/components/accommodation/AccommodationForm';
import { ImageUploader } from '../features/housing/components/accommodation/ImageUploader';
import { useCreateAccommodation } from '../features/housing/hooks/useCreateAccommodation';
import type { AccommodationResponse, AccommodationImageResponse } from '../features/housing/types/accommodation.types';
import clsx from 'clsx';

// ── Wizard steps config ───────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Alojamiento', icon: <Home size={18} /> },
  { id: 2, label: 'Fotos', icon: <Image size={18} /> },
] as const;

type StepId = (typeof STEPS)[number]['id'];

// ── Step progress indicator ──────────────────────────────────────────

interface StepIndicatorProps {
  currentStep: StepId;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => (
  <nav aria-label="Pasos del proceso" className="flex items-center gap-0">
    {STEPS.map((step, index) => {
      const isDone = step.id < currentStep;
      const isCurrent = step.id === currentStep;

      return (
        <div key={step.id} className="flex items-center">
          {/* Step bubble */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 text-label-sm font-label-sm transition-all duration-300',
                isDone
                  ? 'border-primary bg-primary text-on-primary'
                  : isCurrent
                  ? 'border-primary bg-surface text-primary'
                  : 'border-outline-variant bg-surface text-on-surface-variant',
              )}
            >
              {isDone ? <CheckCircle size={20} /> : step.icon}
            </div>
            <span
              className={clsx(
                'text-label-sm font-label-sm hidden sm:block',
                isCurrent ? 'text-primary' : 'text-on-surface-variant',
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < STEPS.length - 1 && (
            <div
              className={clsx(
                'h-0.5 w-16 sm:w-24 mx-2 rounded transition-colors duration-300',
                step.id < currentStep ? 'bg-primary' : 'bg-outline-variant',
              )}
            />
          )}
        </div>
      );
    })}
  </nav>
);

// ── Page ─────────────────────────────────────────────────────────────

/**
 * Wizard page that guides a host through:
 *   Step 1 — Create the physical Accommodation (POST /api/v1/accommodation)
 *   Step 2 — Upload photos for the created Accommodation
 */
export const CreateAccommodationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Accommodation state — filled after Step 1 succeeds
  const [accommodation, setAccommodation] = useState<AccommodationResponse | null>(null);
  const [images, setImages] = useState<AccommodationImageResponse[]>([]);

  const {
    createAccommodation,
    isLoading: isCreatingAccommodation,
    error: accommodationError,
  } = useCreateAccommodation();


  // ── Step 1: Create the Accommodation ─────────────────────────────
  const handleAccommodationSubmit = async (data: Parameters<typeof createAccommodation>[0]) => {
    const result = await createAccommodation(data);
    if (result) {
      setAccommodation(result);
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Step 2: Images (optional but encouraged) ──────────────────────
  const handleFinish = () => {
    navigate('/my-listings', { replace: true });
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-display-lg-mobile md:text-headline-md font-headline-md text-on-surface mb-2">
            Registra tu alojamiento
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Sigue los pasos para dar de alta tu inmueble en la plataforma.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-16 flex justify-center">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* ── STEP 1: Accommodation ─────────────────────────────────── */}
        {currentStep === 1 && (
          <AccommodationForm
            onSubmit={handleAccommodationSubmit}
            isLoading={isCreatingAccommodation}
            error={accommodationError}
          />
        )}

        {/* ── STEP 2: Images ────────────────────────────────────────── */}
        {currentStep === 2 && accommodation && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">
                Añade fotos de tu alojamiento
              </h2>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Los anuncios con fotos reciben hasta 3 veces más visitas. Puedes añadir más fotos después.
              </p>
            </div>

            <ImageUploader
              accommodationId={accommodation.id}
              images={images}
              onImagesChange={setImages}
            />

            <div className="flex justify-end items-center mt-4">
              <button
                type="button"
                id="finish-btn"
                onClick={handleFinish}
                className="px-8 py-3 rounded-xl bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity"
              >
                Finalizar
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

