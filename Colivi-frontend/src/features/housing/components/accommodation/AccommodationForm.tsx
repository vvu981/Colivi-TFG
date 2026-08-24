import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Home, MapPin, Bath, BedDouble, Maximize2, Globe } from 'lucide-react';
import { AmenitySelector } from './AmenitySelector';
import { MapPicker } from './MapPicker';
import { CountrySelectField } from '../../../../components/ui/CountrySelectField';
import type { AmenityType, AccommodationRequest, AccommodationResponse } from '../../types/accommodation.types';

// ── Validation schema ────────────────────────────────────────────────

const toNumber = (val: unknown) => (val === '' || val == null ? undefined : Number(val));

const accommodationSchema = z.object({
  address: z.string().min(1, 'La dirección es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  province: z.string().min(1, 'La provincia es obligatoria'),
  country: z.string().min(1, 'El país es obligatorio'),
  totalRooms: z.preprocess(toNumber, z.number({ message: 'Por favor, ingresa un número válido' }).int('Debe ser un número entero').min(1, 'Mínimo 1 habitación')) as unknown as z.ZodType<number>,
  totalBathrooms: z.preprocess(toNumber, z.number({ message: 'Por favor, ingresa un número válido' }).int('Debe ser un número entero').min(1, 'Mínimo 1 baño')) as unknown as z.ZodType<number>,
  freeRooms: z.preprocess(toNumber, z.number({ message: 'Por favor, ingresa un número válido' }).int('Debe ser un número entero').min(0, 'No puede ser negativo')) as unknown as z.ZodType<number>,
  squareMeters: z.preprocess(toNumber, z.number({ message: 'Por favor, ingresa un número válido' }).int('Debe ser un número entero').min(1, 'Mínimo 1 m²')) as unknown as z.ZodType<number>,
});

type AccommodationFormValues = z.infer<typeof accommodationSchema>;

// ── Props ────────────────────────────────────────────────────────────

interface AccommodationFormProps {
  onSubmit: (data: AccommodationRequest) => void;
  isLoading?: boolean;
  error?: string | null;
  initialData?: AccommodationResponse | null;
  submitText?: string;
}

// ── Reusable field component ─────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

const Field = ({ id, label, icon, error, children }: FieldProps) => (
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
      {error && (
        <span className="text-label-sm font-label-sm text-error">{error}</span>
      )}
    </div>
  </div>
);

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-colors';

// ── Component ────────────────────────────────────────────────────────

/**
 * Form for creating or editing a physical Accommodation.
 * Collects all required fields for AccommodationRequest:
 * address, city, province, country, rooms, bathrooms, squareMeters,
 * coordinates (via MapPicker), and amenities (via AmenitySelector).
 */
export const AccommodationForm = ({
  onSubmit,
  isLoading = false,
  error,
  initialData,
  submitText = 'Continuar →',
}: AccommodationFormProps) => {
  const [amenities, setAmenities] = useState<AmenityType[]>(
    initialData?.amenities || []
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialData ? { lat: initialData.latitude, lng: initialData.longitude } : null
  );
  const [coordsError, setCoordsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<AccommodationFormValues>({
    resolver: zodResolver(accommodationSchema) as import('react-hook-form').Resolver<AccommodationFormValues>,
    defaultValues: initialData
      ? {
          address: initialData.address,
          city: initialData.city,
          province: initialData.province,
          country: initialData.country,
          totalRooms: initialData.totalRooms,
          totalBathrooms: initialData.totalBathrooms,
          freeRooms: initialData.freeRooms,
          squareMeters: initialData.squareMeters,
        }
      : {
          country: 'España',
        },
  });

  // Build the address query for geocoding from current form values
  const address = watch('address');
  const city = watch('city');
  const province = watch('province');
  const country = watch('country');
  const addressQuery = [address, city, province, country].filter(Boolean).join(', ');

  const handleValidSubmit = (values: AccommodationFormValues) => {
    if (!coords) {
      setCoordsError('Debes seleccionar la ubicación en el mapa antes de continuar.');
      return;
    }
    setCoordsError(null);

    const payload: AccommodationRequest = {
      ...values,
      latitude: coords.lat,
      longitude: coords.lng,
      amenities,
    };
    onSubmit(payload);
  };

  return (
    <form
      id="accommodation-form"
      onSubmit={handleSubmit(handleValidSubmit)}
      className="flex flex-col gap-8"
      noValidate
    >
      {/* ── Section: Location ─────────────────────────── */}
      <section className="flex flex-col gap-5">
        <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
          <MapPin size={20} className="text-primary" />
          Ubicación del alojamiento
        </h2>

        <Field id="address" label="Dirección" error={errors.address?.message}>
          <input
            id="address"
            type="text"
            placeholder="Calle Gran Vía, 42, 3º A"
            className={inputClass}
            {...register('address')}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="city" label="Ciudad" error={errors.city?.message}>
            <input
              id="city"
              type="text"
              placeholder="Madrid"
              className={inputClass}
              {...register('city')}
            />
          </Field>

          <Field id="province" label="Provincia" error={errors.province?.message}>
            <input
              id="province"
              type="text"
              placeholder="Madrid"
              className={inputClass}
              {...register('province')}
            />
          </Field>
        </div>

        <Field
          id="country"
          label="País"
          icon={<Globe size={16} />}
          error={errors.country?.message}
        >
          <Controller
            name="country"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CountrySelectField
                value={value}
                onChange={onChange}
                error={!!errors.country}
              />
            )}
          />
        </Field>

        {/* Map picker */}
        <div className="flex flex-col gap-2">
          <label className="text-label-md font-label-md text-on-surface flex items-center gap-1.5">
            <MapPin size={16} className="text-primary" />
            Coordenadas (ubicación en mapa)
          </label>
          <MapPicker
            addressQuery={addressQuery}
            value={coords}
            onChange={(c) => { setCoords(c); setCoordsError(null); }}
          />
          {coordsError && (
            <span className="text-label-sm font-label-sm text-error">{coordsError}</span>
          )}
        </div>
      </section>

      {/* ── Section: Property details ─────────────────── */}
      <section className="flex flex-col gap-5">
        <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
          <Home size={20} className="text-primary" />
          Detalles del inmueble
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field
            id="totalRooms"
            label="Habitaciones totales"
            icon={<BedDouble size={15} />}
            error={errors.totalRooms?.message}
          >
            <input
              id="totalRooms"
              type="number"
              min={1}
              placeholder="3"
              className={inputClass}
              {...register('totalRooms')}
            />
          </Field>

          <Field
            id="freeRooms"
            label="Habitaciones libres"
            icon={<BedDouble size={15} />}
            error={errors.freeRooms?.message}
          >
            <input
              id="freeRooms"
              type="number"
              min={0}
              placeholder="1"
              className={inputClass}
              {...register('freeRooms')}
            />
          </Field>

          <Field
            id="totalBathrooms"
            label="Baños"
            icon={<Bath size={15} />}
            error={errors.totalBathrooms?.message}
          >
            <input
              id="totalBathrooms"
              type="number"
              min={1}
              placeholder="1"
              className={inputClass}
              {...register('totalBathrooms')}
            />
          </Field>

          <Field
            id="squareMeters"
            label="Metros cuadrados"
            icon={<Maximize2 size={15} />}
            error={errors.squareMeters?.message}
          >
            <input
              id="squareMeters"
              type="number"
              min={1}
              placeholder="80"
              className={inputClass}
              {...register('squareMeters')}
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Amenities ────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-headline-sm font-headline-sm text-on-surface">
          Servicios y características
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant -mt-2">
          Selecciona los servicios disponibles en el alojamiento.
        </p>
        <AmenitySelector value={amenities} onChange={setAmenities} />
      </section>

      {/* ── Global error ──────────────────────────────── */}
      {error && (
        <p className="rounded-lg bg-error-container text-on-error-container text-label-md font-label-md px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Submit ─────────────────────────────────────── */}
      <button
        type="submit"
        id="accommodation-submit-btn"
        disabled={isLoading}
        className="self-end px-8 py-3 rounded-xl bg-primary text-on-primary text-label-md font-label-md
          hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isLoading ? 'Guardando...' : submitText}
      </button>
    </form>
  );
};
