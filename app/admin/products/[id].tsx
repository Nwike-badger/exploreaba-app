import { useLocalSearchParams } from 'expo-router';
import ProductEditorScreen from '@/components/admin/editor/ProductEditorScreen';

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductEditorScreen productId={id} />;
}