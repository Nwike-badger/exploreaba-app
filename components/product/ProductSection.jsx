import { View } from 'react-native';
import SectionHeader from './SectionHeader';

const ProductSection = ({ title, align, actionText, onAction, className = '', children }) => {
  return (
    <View className={`py-0 ${className}`}>
      {title && (
        <SectionHeader
          title={title}
          align={align}
          actionText={actionText}
          onAction={onAction}
        />
      )}
      {children}
    </View>
  );
};

export default ProductSection;