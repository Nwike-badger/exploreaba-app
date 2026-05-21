import { View } from 'react-native';
import ProductCard from './ProductCard';

/**
 * ProductGrid (mobile)
 *
 * Two-column grid is the default for phones. We expose `columns` for tablet
 * layouts later. For long scrollable lists, prefer FlatList with numColumns
 * instead of this — flexbox isn't virtualized.
 */
const ProductGrid = ({
  products,
  columns = 2,
  gap = 'normal',
  isFlashSale = false,
  priorityCount = 5,
}) => {
  // Width percentages account for the gap. Imperfect but reads fine on screen.
  const widthClassMap = {
    2: 'w-[48.5%]',
    3: 'w-[31.5%]',
    4: 'w-[23%]',
  };
  const gapClassMap = {
    tight:  'gap-1.5',
    normal: 'gap-2',
    wide:   'gap-3',
  };

  const widthClass = widthClassMap[columns] || widthClassMap[2];
  const gapClass = gapClassMap[gap] || gapClassMap.normal;

  return (
    <View className={`flex-row flex-wrap ${gapClass}`}>
      {products.map((product, index) => (
        <View key={product.id} className={widthClass}>
          <ProductCard
            product={product}
            isFlashSale={isFlashSale}
            priority={index < priorityCount}
          />
        </View>
      ))}
    </View>
  );
};

export default ProductGrid;