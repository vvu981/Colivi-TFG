/**
 * Constantes y funciones de utilidad para la subida de archivos de usuario.
 */
export const MAX_AVATAR_SIZE_MB = 10;
export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

/**
 * Valida si el tamaño de un archivo no excede el límite permitido en megabytes.
 * @param file Archivo a validar
 * @param maxMb Tamaño máximo en MB (por defecto 10 MB)
 */
export const isFileSizeAllowed = (file: File, maxMb: number = MAX_AVATAR_SIZE_MB): boolean => {
  return file.size <= maxMb * 1024 * 1024;
};
