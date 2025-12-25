import React, { useState } from 'react';
import { X, Package, Beaker, ShoppingCart, Plus, Minus, Sparkles } from 'lucide-react';
import type { Product, ProductVariation } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, variation: ProductVariation | undefined, quantity: number) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onAddToCart }) => {
  // Select first available variation, or first variation if all are out of stock
  const getFirstAvailableVariation = () => {
    if (!product.variations || product.variations.length === 0) return undefined;
    const available = product.variations.find(v => v.stock_quantity > 0);
    return available || product.variations[0];
  };

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    getFirstAvailableVariation()
  );
  const [quantity, setQuantity] = useState(1);

  // Check if there's a discount - either at product level or variation level
  const hasVariationDiscount = selectedVariation && selectedVariation.discount_price !== null && selectedVariation.discount_price !== undefined;
  const hasProductDiscount = product.discount_active && product.discount_price;
  const hasDiscount = hasVariationDiscount || hasProductDiscount;

  // Get original and current prices based on variation or product
  const getOriginalPrice = () => {
    if (selectedVariation) {
      return selectedVariation.price; // Variation's base price is always the original
    }
    return product.base_price;
  };

  const getCurrentPrice = () => {
    if (selectedVariation) {
      // If variation has its own discount, use that
      if (selectedVariation.discount_price !== null && selectedVariation.discount_price !== undefined) {
        return selectedVariation.discount_price;
      }
      return selectedVariation.price;
    }
    // No variation - use product-level pricing
    if (hasProductDiscount) {
      return product.discount_price!;
    }
    return product.base_price;
  };

  const originalPrice = getOriginalPrice();
  const currentPrice = getCurrentPrice();
  const savingsAmount = hasDiscount ? originalPrice - currentPrice : 0;

  // Check if product has any available stock
  const hasAnyStock = product.variations && product.variations.length > 0
    ? product.variations.some(v => v.stock_quantity > 0)
    : product.stock_quantity > 0;

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  const handleAddToCart = () => {
    onAddToCart(product, selectedVariation, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden my-2 sm:my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white p-3 sm:p-4 md:p-6 relative border-b-2 border-gold-500/30">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-white hover:text-gold-400"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          <div className="pr-10 sm:pr-12">
            <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1.5 sm:mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">{product.name}</h2>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
              <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold bg-gold-500/20 backdrop-blur-sm border border-gold-500/40 text-gold-300">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-0.5 sm:mr-1" />
                {product.purity_percentage}% Pure
              </span>
              {product.featured && (
                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold bg-gold-500/20 backdrop-blur-sm border border-gold-500/40 text-gold-300">
                  ⭐ Featured
                </span>
              )}
              {hasDiscount && (
                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold bg-gold-500/20 backdrop-blur-sm border border-gold-500/40 text-gold-300">
                  🎉 Sale
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-280px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Left Column */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Product Image */}
              {product.image_url && (
                <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl overflow-hidden border-2 border-gold-300/30 shadow-lg">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <Beaker className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold-600" />
                  Product Description
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Complete Set Inclusions */}
              {product.inclusions && product.inclusions.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-gold-300/30 shadow-sm">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold-600" />
                    Complete Set Includes
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {product.inclusions.map((item, index) => (
                      <li key={index} className="text-[11px] sm:text-xs md:text-sm text-gray-700 flex items-start gap-1.5 sm:gap-2">
                        <span className="text-gold-600 font-bold mt-0.5">✓</span>
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scientific Details */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gold-300/30">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <Beaker className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold-600" />
                  Scientific Information
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-[11px] sm:text-xs md:text-sm">Purity:</span>
                    <span className="font-semibold text-gold-600 text-[11px] sm:text-xs md:text-sm">{product.purity_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-[11px] sm:text-xs md:text-sm">Storage:</span>
                    <span className="font-medium text-gray-700 text-[11px] sm:text-xs md:text-sm">{product.storage_conditions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-[11px] sm:text-xs md:text-sm">Stock:</span>
                    <span className={`font-medium text-[11px] sm:text-xs md:text-sm ${(product.variations && product.variations.length > 0
                      ? product.variations.some(v => v.stock_quantity > 0)
                      : product.stock_quantity > 0)
                      ? 'text-gold-600'
                      : 'text-red-600'
                      }`}>
                      {product.variations && product.variations.length > 0
                        ? product.variations.reduce((sum, v) => sum + v.stock_quantity, 0)
                        : product.stock_quantity} units
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Purchase Section */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Price */}
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border-2 border-gold-300/30 shadow-lg">
                <div className="text-center mb-3 sm:mb-4">
                  {hasDiscount && (
                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 line-through mb-0.5 sm:mb-1">
                      ₱{originalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </div>
                  )}
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gold-600">
                    ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                  </div>
                  {hasDiscount && savingsAmount > 0 && (
                    <div className="inline-block bg-gradient-to-r from-black to-gray-900 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-bold mt-1 sm:mt-1.5 md:mt-2 border border-gold-500/20">
                      Save ₱{savingsAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </div>
                  )}
                </div>

                {/* Size Selection */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                      Select Size:
                    </label>
                    <select
                      value={selectedVariation?.id || ''}
                      onChange={(e) => {
                        const variation = product.variations?.find(v => v.id === e.target.value);
                        if (variation && variation.stock_quantity > 0) {
                          setSelectedVariation(variation);
                        }
                      }}
                      className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gold-300/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 font-medium text-xs sm:text-sm md:text-base shadow-sm hover:border-gold-400 transition-colors"
                    >
                      {product.variations.map((variation) => {
                        const isOutOfStock = variation.stock_quantity === 0;
                        const hasVariationDiscount = variation.discount_price !== null && variation.discount_price !== undefined;
                        const displayPrice = hasVariationDiscount ? variation.discount_price! : variation.price;
                        return (
                          <option
                            key={variation.id}
                            value={variation.id}
                            disabled={isOutOfStock}
                            className={isOutOfStock ? 'line-through text-gray-400 italic' : ''}
                          >
                            {variation.name} - ₱{displayPrice.toLocaleString('en-PH')}
                            {hasVariationDiscount ? ` (was ₱${variation.price.toLocaleString('en-PH')})` : ''}
                            {isOutOfStock ? ' (Out of Stock)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {selectedVariation && selectedVariation.stock_quantity === 0 && (
                      <p className="text-xs text-red-600 mt-1.5 font-semibold">
                        ⚠️ This size is currently out of stock. Please select another size.
                      </p>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Quantity:
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                    <button
                      onClick={decrementQuantity}
                      className="p-2 sm:p-2.5 md:p-3 bg-white border-2 border-gold-300/30 hover:bg-gold-50 hover:border-gold-400 rounded-lg sm:rounded-xl transition-all shadow-sm"
                    >
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold-600" />
                    </button>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 min-w-[40px] sm:min-w-[50px] md:min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      className="p-2 sm:p-2.5 md:p-3 bg-white border-2 border-gold-300/30 hover:bg-gold-50 hover:border-gold-400 rounded-lg sm:rounded-xl transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold-600" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 border-2 border-gold-500/30 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium text-xs sm:text-sm md:text-base">Total:</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gold-400">
                      ₱{(currentPrice * quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!hasAnyStock || (selectedVariation && selectedVariation.stock_quantity === 0) || (!selectedVariation && product.stock_quantity === 0)}
                  className="w-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-gold-500/20 hover:border-gold-500/40"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  {!hasAnyStock || (selectedVariation && selectedVariation.stock_quantity === 0) || (!selectedVariation && product.stock_quantity === 0) ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {/* Stock Alert */}
              {product.available && (product.variations && product.variations.length > 0
                ? product.variations.some(v => v.stock_quantity > 0 && v.stock_quantity < 10)
                : product.stock_quantity < 10 && product.stock_quantity > 0) && (
                  <div className="bg-gold-50 border border-gold-300 sm:border-2 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gold-800 font-semibold flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-lg md:text-xl">⚠️</span>
                      Low stock! Only {product.variations && product.variations.length > 0
                        ? product.variations.reduce((sum, v) => sum + v.stock_quantity, 0)
                        : product.stock_quantity} units left
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;

