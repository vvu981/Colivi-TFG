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
      .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Por favor, confirma tu contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

// Inferencia del tipo para react-hook-form
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
