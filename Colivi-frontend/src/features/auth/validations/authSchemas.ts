import { z } from 'zod';

// Esquema para la recuperación de contraseña
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Por favor, introduce tu correo electrónico.')
    .email('El formato del correo electrónico no es válido.'),
});

// Inferencia del tipo para react-hook-form
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Esquema para el restablecimiento de contraseña
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula.')
      .regex(/[0-9]/, 'Debe contener al menos un número.'),
    confirmPassword: z.string().min(1, 'Por favor, confirma tu contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

// Inferencia del tipo para react-hook-form
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Esquema para la solicitud de reactivación de cuenta
export const reactivationRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Por favor, introduce tu correo electrónico.')
    .email('El formato del correo electrónico no es válido.'),
});

export type ReactivationRequestFormData = z.infer<typeof reactivationRequestSchema>;

