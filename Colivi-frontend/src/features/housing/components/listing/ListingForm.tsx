import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Euro, FileText, Tag } from 'lucide-react';
import clsx from 'clsx';
import type { AccommodationListingRequest, RentalType, AccommodationListingResponse } from '../../types/listing.types';
import type { AccommodationResponse } from '../../types/accommodation.types';
import { useListingsByAccommodation } from '../../hooks/useListingsByAccommodation';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { ListingImageSelector } from './ListingImageSelector';

// ── Validation schema ────────────────────────────────────────────────

const toNumber = (val: unknown) => (val === '' || val == null ? undefined : Number(val));

const listingSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(120, 'Máximo 120 caracteres'),
  description: z
    .string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  pricePerMonth: z.preprocess(toNumber, z.number({ message: 'Por favor, ingresa un importe válido' }).min(1, 'El precio debe ser mayor que 0')) as unknown as z.ZodType<number>,
  securityDeposit: z.preprocess(toNumber, z.number({ message: 'Por favor, ingresa un importe válido' }).min(0, 'La fianza no puede ser negativa')) as unknown as z.ZodType<number>,
  rentalType: z.enum(['ENTIRE_PLACE', 'ROOM'] as const, {
    message: 'Selecciona el tipo de alquiler',
  }),
  selectedImages: z.array(z.string()).min(1, 'Debes seleccionar al menos una foto para el anuncio'),
});

type ListingFormValues = z.infer<typeof listingSchema>;

// ── Props ────────────────────────────────────────────────────────────

interface ListingFormProps {
  /** The Accommodation this listing will reference */
  accommodation: AccommodationResponse;
  onSubmit: (data: AccommodationListingRequest) => void;
  isLoading?: boolean;
  error?: string | null;
  initialData?: AccommodationListingResponse | null;
  submitText?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-colors';

interface FieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

const Field = ({ id, label, icon, error, hint, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5 h-full">
    <label
      htmlFor={id}
      className="flex items-start gap-1.5 text-label-md font-label-md text-on-surface"
    >
      {icon && <span className="mt-0.5">{icon}</span>}
      <span className="leading-tight">{label}</span>
    </label>
    <div className="mt-auto flex flex-col gap-1.5 w-full">
      {children}
      {hint && !error && (
        <span className="text-label-sm font-label-sm text-on-surface-variant">{hint}</span>
      )}
      {error && (
        <span className="text-label-sm font-label-sm text-error">{error}</span>
      )}
    </div>
  </div>
);

// ── Component ────────────────────────────────────────────────────────

/**
 * Form for creating an AccommodationListing (the published ad).
 * Requires an existing accommodationId (passed as a prop after
 * the Accommodation was successfully created in Step 1).
 *
 * Fields: title, description, pricePerMonth, securityDeposit, rentalType.
 */
export const ListingForm = ({
  accommodation,
  onSubmit,
  isLoading = false,
  error,
  initialData,
  submitText = 'Publicar anuncio',
}: ListingFormProps) => {
  const { listings: activeListings, isLoading: isLoadingListings } = useListingsByAccommodation(accommodation.id);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema) as import('react-hook-form').Resolver<ListingFormValues>,
        defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          pricePerMonth: initialData.pricePerMonth,
          securityDeposit: initialData.securityDeposit,
          rentalType: initialData.rentalType as RentalType,
          selectedImages: initialData.selectedImages?.sort((a, b) => a.displayOrder - b.displayOrder).map(img => img.id) || [],
        }
      : {
          rentalType: undefined,
          securityDeposit: 0,
          selectedImages: [],
        },
  });

  const selectedRentalType = watch('rentalType');
  const descriptionValue = watch('description') ?? '';
  const selectedImagesValue = watch('selectedImages') ?? [];

  const handleValidSubmit = (values: ListingFormValues) => {
    const payload: AccommodationListingRequest = {
      accommodationId: accommodation.id,
      title: values.title,
      description: values.description,
      pricePerMonth: values.pricePerMonth,
      securityDeposit: values.securityDeposit,
      rentalType: values.rentalType as RentalType,
      selectedImages: values.selectedImages,
    };
    onSubmit(payload);
  };

  // --- UX DEFENSIVA ---
  const currentListingId = initialData?.id;
  const otherActiveListings = activeListings.filter(l => l.id !== currentListingId);
  const hasEntirePlace = otherActiveListings.some(l => l.rentalType === 'ENTIRE_PLACE');
  const hasRooms = otherActiveListings.some(l => l.rentalType === 'ROOM');
  const roomCount = otherActiveListings.filter(l => l.rentalType === 'ROOM').length;
  
  const isRoomLimitReached = roomCount >= accommodation.totalRooms;
  
  // Regla 1 y 3: Bloqueo total del botón si ya hay ENTIRE_PLACE o se llegó al límite físico
  // Sin embargo, si estoy editando, el RentalType ya está fijado y no debe chocar. 
  // Para simplificar, si estoy creando un anuncio nuevo, y hasEntirePlace es true, todo se bloquea.
  // Si estoy creando y isRoomLimitReached, solo ENTIRE_PLACE y ROOM están bloqueados (todo bloqueado).
  // Si estoy creando y hasRooms, ENTIRE_PLACE se bloquea.
  const isEntirePlaceDisabled = hasRooms || hasEntirePlace || isRoomLimitReached;
  const isRoomDisabled = hasEntirePlace || isRoomLimitReached;
  
  const hasNoImages = !accommodation.images || accommodation.images.length === 0;
  const disableSubmit = isLoading || isLoadingListings || (isEntirePlaceDisabled && isRoomDisabled) || hasNoImages;

  return (
    <form
      id="listing-form"
      onSubmit={handleSubmit(handleValidSubmit)}
      className="flex flex-col gap-8"
      noValidate
    >
      {/* ── Rental type selector ──────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
          <Tag size={20} className="text-primary" />
          ¿Qué alquilas?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              {
                value: 'ROOM' as const,
                title: 'Una habitación',
                description: 'Alquilas una habitación en un piso compartido.',
                disabled: isRoomDisabled,
              },
              {
                value: 'ENTIRE_PLACE' as const,
                title: 'El piso completo',
                description: 'El inquilino tendrá todo el alojamiento para él.',
                disabled: isEntirePlaceDisabled,
              },
            ] as { value: RentalType; title: string; description: string; disabled: boolean }[]
          ).map(({ value, title, description, disabled }) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              id={`rental-type-${value.toLowerCase()}`}
              onClick={() => setValue('rentalType', value, { shouldValidate: true })}
              className={clsx(
                'flex flex-col items-start text-left rounded-xl border-2 p-5 transition-all duration-200',
                disabled && 'opacity-50 cursor-not-allowed bg-surface-container/50 border-outline-variant',
                !disabled && selectedRentalType === value
                  ? 'border-primary bg-primary-fixed/10 shadow-sm'
                  : !disabled && 'border-outline-variant bg-surface hover:border-primary/50',
              )}
            >
              <span className="text-label-md font-label-md text-on-surface mb-1">
                {title}
              </span>
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                {description}
              </span>
            </button>
          ))}
        </div>
        
        {/* Alertas de reglas de negocio */}
        {hasEntirePlace && !initialData && (
          <p className="text-label-md font-label-md text-error flex items-center gap-2 mt-2">
            El alojamiento ya está alquilado por completo.
          </p>
        )}
        {hasRooms && !initialData && !hasEntirePlace && !isRoomLimitReached && (
          <p className="text-label-md font-label-md text-on-surface-variant flex items-center gap-2 mt-2">
            No se puede alquilar el piso completo porque ya hay habitaciones anunciadas.
          </p>
        )}
        {isRoomLimitReached && !initialData && (
          <p className="text-label-md font-label-md text-error flex items-center gap-2 mt-2">
            Has alcanzado el límite de {accommodation.totalRooms} habitaciones para este inmueble.
          </p>
        )}
        
        {errors.rentalType && !disableSubmit && (
          <span className="text-label-sm font-label-sm text-error">
            {errors.rentalType.message}
          </span>
        )}
      </section>

      {/* ── Photos ───────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
          <ImageIcon size={20} className="text-primary" />
          Fotos del anuncio
        </h2>
        
        {hasNoImages ? (
          <p className="rounded-lg bg-error-container text-on-error-container text-label-md font-label-md px-4 py-3">
            No puedes crear un anuncio si el inmueble no tiene fotos. Añade fotos primero desde la página del inmueble.
          </p>
        ) : (
          <ListingImageSelector
            accommodationImages={accommodation.images}
            value={selectedImagesValue}
            onChange={(val) => setValue('selectedImages', val, { shouldValidate: true })}
            error={errors.selectedImages?.message}
          />
        )}
      </section>

      {/* ── Ad details ───────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Información del anuncio
        </h2>

        <Field
          id="listing-title"
          label="Título del anuncio"
          error={errors.title?.message}
          hint="Un título atractivo aumenta las visitas a tu anuncio."
        >
          <input
            id="listing-title"
            type="text"
            placeholder="Ej: Habitación luminosa cerca del metro"
            maxLength={120}
            className={inputClass}
            {...register('title')}
          />
        </Field>

        <Field
          id="listing-description"
          label="Descripción"
          error={errors.description?.message}
          hint={`${descriptionValue.length}/2000 caracteres`}
        >
          <textarea
            id="listing-description"
            rows={6}
            placeholder="Describe el alojamiento: características, normas, transporte cercano..."
            maxLength={2000}
            className={clsx(inputClass, 'resize-none')}
            {...register('description')}
          />
        </Field>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
          <Euro size={20} className="text-primary" />
          Precio
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="pricePerMonth"
            label="Precio mensual (€)"
            error={errors.pricePerMonth?.message}
          >
            <div className="relative">
              <input
                id="pricePerMonth"
                type="number"
                min={1}
                step={0.01}
                placeholder="500"
                className={clsx(inputClass, 'pl-10')}
                {...register('pricePerMonth')}
              />
              <Euro
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </Field>

          <Field
            id="securityDeposit"
            label="Fianza (€)"
            hint="Puede ser 0 si no exiges fianza."
            error={errors.securityDeposit?.message}
          >
            <div className="relative">
              <input
                id="securityDeposit"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                className={clsx(inputClass, 'pl-10')}
                {...register('securityDeposit')}
              />
              <Euro
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </Field>
        </div>
      </section>

      {/* ── Global error ──────────────────────────────── */}
      {error && (
        <p className="rounded-lg bg-error-container text-on-error-container text-label-md font-label-md px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Submit ────────────────────────────────────── */}
      <button
        type="submit"
        id="listing-submit-btn"
        disabled={disableSubmit}
        className="self-end px-8 py-3 rounded-xl bg-primary text-on-primary text-label-md font-label-md
          hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
      >
        {isLoadingListings ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Cargando...
          </>
        ) : isLoading ? (
          'Guardando...'
        ) : (
          submitText
        )}
      </button>
    </form>
  );
};
