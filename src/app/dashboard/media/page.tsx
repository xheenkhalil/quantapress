// 1. Rename the import to be explicit
import MediaLibraryComponent from '@/components/media/MediaLibrary';

export default function MediaPage() {
  // 2. Use the new name
  return <MediaLibraryComponent />;
}