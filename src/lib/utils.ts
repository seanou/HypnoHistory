import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a URL to a Data URL.
 * NOTE: This function is for client-side use only.
 * @param url The URL to convert.
 * @returns A promise that resolves with the Data URL.
 */
export function toDataURL(url: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      reject(error);
    }
  });
};
