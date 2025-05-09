// utils/fileDownloader.js

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Descarga y comparte un archivo dado su contenido en base64 y su nombre.
 * @param {Object} file - El archivo a descargar.
 * @param {string} file.name - Nombre del archivo (ej: "tarea1.pdf").
 * @param {string} file.content - Contenido del archivo codificado en base64.
 */
export const downloadAndShareFile = async (file) => {
  try {
    const fileUri = FileSystem.documentDirectory + file.name;

    await FileSystem.writeAsStringAsync(fileUri, file.content, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      alert('El archivo se guardó localmente en almacenamiento interno');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Hubo un error al descargar el archivo.');
  }
};
