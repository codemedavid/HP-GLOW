import { useState, useEffect } from 'react';
import type { CartItem, Product, ProductVariation } from '../types';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('peptide_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('peptide_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, variation?: ProductVariation, quantity: number = 1) => {
    // Check stock availability
    const availableStock = variation ? variation.stock_quantity : product.stock_quantity;

    if (availableStock === 0) {
      alert(`Sorry, ${product.name}${variation ? ` ${variation.name}` : ''} is out of stock.`);
      return;
    }

    // Use discount price if available for variation, otherwise use regular price
    const price = variation
      ? (variation.discount_price !== null && variation.discount_price !== undefined ? variation.discount_price : variation.price)
      : (product.discount_active && product.discount_price ? product.discount_price : product.base_price);

    const existingItemIndex = cartItems.findIndex(
      item => item.product.id === product.id &&
        (variation ? item.variation?.id === variation.id : !item.variation)
    );

    if (existingItemIndex > -1) {
      // Update existing item - check if new total exceeds stock
      const currentQuantity = cartItems[existingItemIndex].quantity;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > availableStock) {
        const remainingStock = availableStock - currentQuantity;
        if (remainingStock > 0) {
          alert(`Only ${remainingStock} item(s) available in stock. Added ${remainingStock} to your cart.`);
          quantity = remainingStock;
        } else {
          alert(`Sorry, you already have the maximum available quantity (${currentQuantity}) in your cart.`);
          return;
        }
      }

      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item - check if quantity exceeds stock
      if (quantity > availableStock) {
        alert(`Only ${availableStock} item(s) available in stock. Added ${availableStock} to your cart.`);
        quantity = availableStock;
      }

      const newItem: CartItem = {
        product,
        variation,
        quantity,
        price
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    // Check stock availability
    const item = cartItems[index];
    const availableStock = item.variation ? item.variation.stock_quantity : item.product.stock_quantity;

    if (quantity > availableStock) {
      alert(`Only ${availableStock} item(s) available in stock.`);
      quantity = availableStock;
    }

    const updatedItems = [...cartItems];
    updatedItems[index].quantity = quantity;
    setCartItems(updatedItems);
  };

  const removeFromCart = (index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('peptide_cart');
  };

  // Reconcile cart items with the latest product data so prices/stock stay
  // current when products are updated (e.g. admin price changes, realtime sync).
  // The cart stores snapshots at add-to-cart time, so without this the cart
  // would keep showing stale prices until the item is removed and re-added.
  const syncCartPrices = (products: Product[]) => {
    setCartItems(prevItems => {
      let changed = false;

      const nextItems = prevItems.map(item => {
        const freshProduct = products.find(p => p.id === item.product.id);
        if (!freshProduct) return item; // product no longer available; leave as-is

        let freshVariation = item.variation;
        if (item.variation) {
          const match = freshProduct.variations?.find(v => v.id === item.variation!.id);
          if (match) freshVariation = match;
        }

        // Only replace references if pricing/stock actually changed to avoid
        // unnecessary re-renders and update loops.
        const productChanged =
          freshProduct.base_price !== item.product.base_price ||
          freshProduct.discount_price !== item.product.discount_price ||
          freshProduct.discount_active !== item.product.discount_active ||
          freshProduct.stock_quantity !== item.product.stock_quantity;

        const variationChanged =
          !!freshVariation && !!item.variation &&
          (freshVariation.price !== item.variation.price ||
            freshVariation.discount_price !== item.variation.discount_price ||
            freshVariation.stock_quantity !== item.variation.stock_quantity);

        if (!productChanged && !variationChanged) return item;

        changed = true;
        return { ...item, product: freshProduct, variation: freshVariation };
      });

      return changed ? nextItems : prevItems;
    });
  };

  // Helper function to get current price for a cart item (respects current discounts)
  const getCurrentItemPrice = (item: CartItem): number => {
    if (item.variation) {
      // Check for variation-level discount first
      if (item.variation.discount_price !== null && item.variation.discount_price !== undefined) {
        return item.variation.discount_price;
      }
      return item.variation.price;
    }
    // Fall back to product-level pricing
    if (item.product.discount_active && item.product.discount_price) {
      return item.product.discount_price;
    }
    return item.product.base_price;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Use current discount prices instead of stored price
      const currentPrice = getCurrentItemPrice(item);
      return total + (currentPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncCartPrices,
    getTotalPrice,
    getTotalItems
  };
}
