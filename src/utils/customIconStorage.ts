import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_DIMENSION_PX = 4096;
export const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export interface PickIconResult {
  cancelled: boolean;
  uri?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Returns the directory path used to store custom subfaction icons locally.
 */
function getIconStorageDirectory(): string {
  if (!FileSystem.documentDirectory) {
    return '';
  }
  return `${FileSystem.documentDirectory}subfaction_icons/`;
}

/**
 * Ensures the subfaction_icons directory exists on disk.
 */
async function ensureDirectoryExists(): Promise<string> {
  const dir = getIconStorageDirectory();
  if (!dir) return '';

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Launches the device photo library picker, validates the selected picture,
 * and copies it into persistent local app storage.
 */
export async function pickSubfactionIcon(): Promise<PickIconResult> {
  try {
    // 1. Request permissions on mobile
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return {
          cancelled: true,
          error: 'Permission to access the photo library was denied. Please allow access in device settings to upload custom emblems.',
        };
      }
    }

    // 2. Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Suggest square ratio for icons
      quality: 0.9,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    const sourceUri = asset.uri;

    // 3. Determine file extension
    let extension = 'png';
    const uriLower = sourceUri.toLowerCase();
    for (const ext of SUPPORTED_IMAGE_EXTENSIONS) {
      if (uriLower.endsWith(`.${ext}`)) {
        extension = ext;
        break;
      }
    }
    if (asset.mimeType) {
      if (asset.mimeType.includes('png')) extension = 'png';
      else if (asset.mimeType.includes('jpeg') || asset.mimeType.includes('jpg')) extension = 'jpg';
      else if (asset.mimeType.includes('webp')) extension = 'webp';
    }

    // 4. Validate file size if available
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_FILE_SIZE_BYTES) {
      const sizeMb = (asset.fileSize / (1024 * 1024)).toFixed(1);
      return {
        cancelled: true,
        error: `Selected image is too large (${sizeMb} MB). Maximum supported file size is 5 MB.`,
      };
    }

    // 5. Validate image dimensions
    if (
      (asset.width && asset.width > MAX_IMAGE_DIMENSION_PX) ||
      (asset.height && asset.height > MAX_IMAGE_DIMENSION_PX)
    ) {
      return {
        cancelled: true,
        error: `Image dimensions (${asset.width}x${asset.height}px) exceed the maximum supported size of ${MAX_IMAGE_DIMENSION_PX}px.`,
      };
    }

    // 6. Copy to persistent application document directory on native
    if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
      const dir = await ensureDirectoryExists();
      const uniqueFileName = `icon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const destinationUri = `${dir}${uniqueFileName}`;

      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });

      return {
        cancelled: false,
        uri: destinationUri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType || `image/${extension}`,
      };
    }

    // On Web or fallback, return original URI
    return {
      cancelled: false,
      uri: sourceUri,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType || `image/${extension}`,
    };
  } catch (err: any) {
    console.error('Error in pickSubfactionIcon:', err);
    return {
      cancelled: true,
      error: err?.message || 'Failed to select and process image from photo library.',
    };
  }
}

/**
 * Safely removes a stored custom icon file from disk.
 */
export async function deleteCustomIconFile(uri?: string): Promise<boolean> {
  if (!uri) return false;
  try {
    if (Platform.OS !== 'web' && FileSystem.documentDirectory && uri.startsWith('file://')) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('Could not delete icon file:', uri, err);
    return false;
  }
}
