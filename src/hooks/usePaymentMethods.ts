import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  qr_code_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching all payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'created_at' | 'updated_at'>) => {
    try {
      // Normalize qr_code_url: undefined/null/empty string → empty string (or placeholder)
      const qrCodeUrl = method.qr_code_url?.trim() || '';
      
      console.log('📤 Adding payment method:', { 
        id: method.id, 
        name: method.name,
        qr_code_url: qrCodeUrl,
        qr_code_url_length: qrCodeUrl.length
      });
      
      const { data, error: insertError } = await supabase
        .from('payment_methods')
        .insert({
          id: method.id,
          name: method.name,
          account_number: method.account_number,
          account_name: method.account_name,
          qr_code_url: qrCodeUrl, // Always explicitly set
          active: method.active,
          sort_order: method.sort_order
        })
        .select('*, qr_code_url') // Explicitly include qr_code_url in response
        .single();

      if (insertError) {
        console.error('❌ Supabase insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Payment method added:', { 
        id: data?.id, 
        qr_code_url: data?.qr_code_url 
      });

      await fetchAllPaymentMethods();
      return data;
    } catch (err) {
      console.error('❌ Error adding payment method:', err);
      throw err;
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      // Create update payload
      const updatePayload: any = {};
      
      // Include all fields that are in the updates object
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.account_number !== undefined) updatePayload.account_number = updates.account_number;
      if (updates.account_name !== undefined) updatePayload.account_name = updates.account_name;
      if (updates.active !== undefined) updatePayload.active = updates.active;
      if (updates.sort_order !== undefined) updatePayload.sort_order = updates.sort_order;
      
      // ALWAYS explicitly handle qr_code_url if it's in updates
      // Normalize: undefined/null → empty string, non-empty → trimmed string
      if ('qr_code_url' in updates) {
        if (updates.qr_code_url !== undefined && updates.qr_code_url !== null) {
          const urlString = String(updates.qr_code_url).trim();
          updatePayload.qr_code_url = urlString === '' ? '' : urlString;
        } else {
          updatePayload.qr_code_url = '';
        }
      }
      
      console.log('📤 Updating payment method:', { 
        id, 
        qr_code_url: updatePayload.qr_code_url,
        qr_code_url_type: typeof updatePayload.qr_code_url,
        qr_code_url_length: updatePayload.qr_code_url?.length || 0,
        has_qr_code_url: 'qr_code_url' in updatePayload,
        payload_keys: Object.keys(updatePayload),
        fullPayload: updatePayload 
      });
      
      const { data, error: updateError } = await supabase
        .from('payment_methods')
        .update(updatePayload)
        .eq('id', id)
        .select('*, qr_code_url') // Explicitly include qr_code_url in response
        .single();

      if (updateError) {
        console.error('❌ Supabase update error:', updateError);
        console.error('❌ Error details:', JSON.stringify(updateError, null, 2));
        throw updateError;
      }

      console.log('✅ Payment method updated:', { 
        id, 
        qr_code_url: data?.qr_code_url,
        qr_code_url_type: typeof data?.qr_code_url,
        qr_code_url_length: data?.qr_code_url?.length || 0
      });
      
      // Verify the qr_code_url was actually saved
      if ('qr_code_url' in updatePayload && updatePayload.qr_code_url && data?.qr_code_url !== updatePayload.qr_code_url) {
        console.warn('⚠️ WARNING: qr_code_url mismatch!', {
          sent: updatePayload.qr_code_url,
          received: data?.qr_code_url
        });
      } else if ('qr_code_url' in updatePayload && updatePayload.qr_code_url && data?.qr_code_url === updatePayload.qr_code_url) {
        console.log('✅ QR code URL verified - matches what was sent');
      }

      await fetchAllPaymentMethods();
      return data;
    } catch (err) {
      console.error('❌ Error updating payment method:', err);
      throw err;
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchAllPaymentMethods();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      throw err;
    }
  };

  const reorderPaymentMethods = async (reorderedMethods: PaymentMethod[]) => {
    try {
      const updates = reorderedMethods.map((method, index) => ({
        id: method.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('payment_methods')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      await fetchAllPaymentMethods();
    } catch (err) {
      console.error('Error reordering payment methods:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    reorderPaymentMethods,
    refetch: fetchPaymentMethods,
    refetchAll: fetchAllPaymentMethods
  };
};