import { z } from 'zod';

export const profileSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede superar los 50 caracteres'),

    email: z
      .string()
      .min(1, 'El correo es requerido')
      .email('Correo electrónico inválido'),

    document: z.string().min(1, 'El documento es requerido'),

    password: z.string().optional().or(z.literal('')),

    confirmPassword: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password.length >= 8;
      }
      return true;
    },
    {
      message: 'La contraseña debe tener al menos 8 caracteres',
      path: ['password'],
    },
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    },
  );

export type ProfileFormValues = z.infer<typeof profileSchema>;
