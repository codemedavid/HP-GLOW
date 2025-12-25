import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, ProductVariation } from '../types';

export function useMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();

    // Set up real-time subscription for product changes with unique channel name
    const channelId = `products-realtime-${Date.now()}`;
    const productsChannel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('✅ Product changed:', payload);
          fetchProducts(); // Refetch all products when any change occurs
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_variations'
        },
        (payload) => {
          console.log('✅ Variation changed:', payload);
          fetchProducts(); // Refetch all products when variations change
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    // Refetch data when window regains focus (user switches back from admin)
    // But only if we're not on the admin page to avoid interfering with forms
    let focusRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleFocus = () => {
      // Check if we're on admin page - if so, don't refresh
      const isAdminPage = window.location.pathname === '/admin';
      if (isAdminPage) {
        console.log('👁️ Window focused on admin page - skipping refresh to avoid form interference');
        return;
      }

      // Debounce focus refresh to avoid too frequent refreshes
      if (focusRefreshTimeout) {
        clearTimeout(focusRefreshTimeout);
      }

      focusRefreshTimeout = setTimeout(() => {
        console.log('👁️ Window focused - refreshing products...');
        fetchProducts();
        focusRefreshTimeout = null;
      }, 1000); // Wait 1 second before refreshing
    };

    // Also add visibility change handler for better cross-tab updates
    // But skip if on admin page
    const handleVisibilityChange = () => {
      if (document.hidden) return;

      const isAdminPage = window.location.pathname === '/admin';
      if (isAdminPage) {
        console.log('👁️ Tab became visible on admin page - skipping refresh');
        return;
      }

      // Debounce visibility refresh
      if (focusRefreshTimeout) {
        clearTimeout(focusRefreshTimeout);
      }

      focusRefreshTimeout = setTimeout(() => {
        console.log('👁️ Tab became visible - refreshing products...');
        fetchProducts();
        focusRefreshTimeout = null;
      }, 1000);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(productsChannel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (focusRefreshTimeout) {
        clearTimeout(focusRefreshTimeout);
      }
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching products from database...');

      // Force fresh data by clearing any potential cache
      const timestamp = Date.now();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      console.log(`📦 Found ${data?.length || 0} products`);

      // Log products with images for debugging
      const productsWithImages = (data || []).filter(p => p.image_url);
      if (productsWithImages.length > 0) {
        console.log(`🖼️ Products with images: ${productsWithImages.length}`,
          productsWithImages.map(p => ({ name: p.name, image_url: p.image_url?.substring(0, 50) + '...' }))
        );
      }

      // Fetch variations for each product
      const productsWithVariations = await Promise.all(
        (data || []).map(async (product) => {
          const { data: variations } = await supabase
            .from('product_variations')
            .select('*')
            .eq('product_id', product.id)
            .order('quantity_mg', { ascending: true });

          if (variations && variations.length > 0) {
            console.log(`  └─ ${product.name}: ${variations.length} variations, prices:`, variations.map(v => `${v.name}:₱${v.price}${v.discount_price ? ` DISCOUNT:₱${v.discount_price}` : ''}`));
          }

          // Log if product has image_url
          if (product.image_url) {
            console.log(`  🖼️ ${product.name} has image: ${product.image_url.substring(0, 60)}...`);
          }

          return {
            ...product,
            variations: variations || []
          };
        })
      );

      console.log('✅ Products updated successfully at', new Date().toLocaleTimeString());
      setProducts(productsWithVariations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('❌ Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Ensure image_url is explicitly included
      const productData: any = {
        ...product,
        image_url: product.image_url !== undefined ? product.image_url : null,
      };

      console.log('📤 Adding product to database:', { name: productData.name, image_url: productData.image_url });
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select('*, image_url') // Explicitly include image_url in response
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Product added to database:', { id: data?.id, image_url: data?.image_url });

      if (data) {
        setProducts([...products, data]);
      }
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error adding product:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add product' };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // Ensure image_url is explicitly included in the update payload
      // Handle both null, undefined, and empty string cases
      let imageUrlValue: string | null = null;
      if (updates.image_url !== undefined && updates.image_url !== null) {
        const urlString = String(updates.image_url).trim();
        imageUrlValue = urlString === '' ? null : urlString;
      }

      // Create update payload with explicit image_url
      const updatePayload: any = {
        ...updates,
        image_url: imageUrlValue, // Always explicitly set image_url
      };

      // Force image_url to be included even if it was somehow excluded
      updatePayload.image_url = imageUrlValue;

      console.log('📤 Updating product in database:', {
        id,
        image_url: updatePayload.image_url,
        image_url_type: typeof updatePayload.image_url,
        image_url_length: updatePayload.image_url?.length || 0,
        payload_keys: Object.keys(updatePayload),
        fullPayload: updatePayload
      });

      // Explicitly select image_url to ensure it's returned
      const { data, error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .select('*, image_url') // Explicitly include image_url in response
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error hint:', error.hint);

        // Provide more helpful error message
        let errorMessage = error.message || 'Unknown error';
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Check Row Level Security (RLS) policies for the products table.';
        } else if (error.message?.includes('column') || error.message?.includes('does not exist')) {
          errorMessage = 'Database column error. Make sure image_url column exists in products table.';
        }

        throw new Error(errorMessage);
      }

      console.log('✅ Product updated in database:', {
        id,
        image_url: data?.image_url,
        image_url_type: typeof data?.image_url,
        image_url_length: data?.image_url?.length || 0,
        fullData: data
      });

      // Verify the image_url was actually saved
      if (updatePayload.image_url && data?.image_url !== updatePayload.image_url) {
        console.warn('⚠️ WARNING: image_url mismatch!', {
          sent: updatePayload.image_url,
          sent_type: typeof updatePayload.image_url,
          received: data?.image_url,
          received_type: typeof data?.image_url
        });
      } else if (updatePayload.image_url && data?.image_url === updatePayload.image_url) {
        console.log('✅ Image URL verified - matches what was sent');
      }

      if (data) {
        // Update local state immediately
        setProducts(products.map(p => p.id === id ? { ...data, variations: p.variations } : p));
      }
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error updating product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      return { success: false, error: errorMessage };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting product:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete product' };
    }
  };

  const addVariation = async (variation: Omit<ProductVariation, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('product_variations')
        .insert([variation])
        .select()
        .single();

      if (error) throw error;

      // Refresh products to include new variation
      await fetchProducts();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding variation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add variation' };
    }
  };

  const updateVariation = async (id: string, updates: Partial<ProductVariation>) => {
    try {
      console.log('📤 Updating variation:', { id, updates });
      const { data, error } = await supabase
        .from('product_variations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Variation update error:', error);
        throw error;
      }

      console.log('✅ Variation updated:', data);

      // Refresh products to include updated variation
      await fetchProducts();
      return { success: true, data };
    } catch (err) {
      console.error('Error updating variation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update variation' };
    }
  };

  const deleteVariation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_variations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh products to remove variation
      await fetchProducts();
      return { success: true };
    } catch (err) {
      console.error('Error deleting variation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete variation' };
    }
  };

  return {
    menuItems: products, // Keep the same name for backward compatibility
    products,
    loading,
    error,
    refreshProducts: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    addVariation,
    updateVariation,
    deleteVariation
  };
}
