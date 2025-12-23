import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Voucher } from '../types';

interface UseVouchersReturn {
    vouchers: Voucher[];
    loading: boolean;
    error: string | null;
    addVoucher: (voucher: Omit<Voucher, 'id' | 'created_at' | 'updated_at' | 'times_used'>) => Promise<{ success: boolean; error?: string; data?: Voucher }>;
    updateVoucher: (id: string, updates: Partial<Voucher>) => Promise<{ success: boolean; error?: string; data?: Voucher }>;
    deleteVoucher: (id: string) => Promise<{ success: boolean; error?: string }>;
    validateVoucher: (code: string, cartTotal: number) => Promise<{ valid: boolean; discount: number; error?: string; voucher?: Voucher }>;
    refreshVouchers: () => Promise<void>;
}

export const useVouchers = (): UseVouchersReturn => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVouchers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('vouchers')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw fetchError;
            }

            setVouchers(data || []);
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch vouchers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const addVoucher = async (voucher: Omit<Voucher, 'id' | 'created_at' | 'updated_at' | 'times_used'>) => {
        try {
            const { data, error: insertError } = await supabase
                .from('vouchers')
                .insert([{ ...voucher, times_used: 0 }])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            setVouchers(prev => [data, ...prev]);
            return { success: true, data };
        } catch (err) {
            console.error('Error adding voucher:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to add voucher' };
        }
    };

    const updateVoucher = async (id: string, updates: Partial<Voucher>) => {
        try {
            const { id: _, created_at, updated_at, ...updateData } = updates as any;

            const { data, error: updateError } = await supabase
                .from('vouchers')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            setVouchers(prev => prev.map(v => v.id === id ? data : v));
            return { success: true, data };
        } catch (err) {
            console.error('Error updating voucher:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update voucher' };
        }
    };

    const deleteVoucher = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            setVouchers(prev => prev.filter(v => v.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting voucher:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to delete voucher' };
        }
    };

    const validateVoucher = async (code: string, cartTotal: number) => {
        try {
            // Fetch the voucher by code
            const { data: voucher, error: fetchError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('code', code.toUpperCase().trim())
                .single();

            if (fetchError || !voucher) {
                return { valid: false, discount: 0, error: 'Invalid voucher code' };
            }

            // Check if voucher is active
            if (!voucher.active) {
                return { valid: false, discount: 0, error: 'This voucher is no longer active' };
            }

            // Check if voucher has expired
            if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
                return { valid: false, discount: 0, error: 'This voucher has expired' };
            }

            // Check if voucher has reached max uses
            if (voucher.max_uses !== null && voucher.times_used >= voucher.max_uses) {
                return { valid: false, discount: 0, error: 'This voucher has reached its usage limit' };
            }

            // Check minimum purchase amount
            if (cartTotal < voucher.min_purchase_amount) {
                return {
                    valid: false,
                    discount: 0,
                    error: `Minimum purchase of ₱${voucher.min_purchase_amount.toLocaleString()} required`
                };
            }

            // Calculate discount
            let discount = 0;
            if (voucher.discount_type === 'percentage') {
                discount = (cartTotal * voucher.discount_value) / 100;
                // Apply max discount cap if set
                if (voucher.max_discount !== null && discount > voucher.max_discount) {
                    discount = voucher.max_discount;
                }
            } else {
                // Fixed discount
                discount = voucher.discount_value;
            }

            // Ensure discount doesn't exceed cart total
            if (discount > cartTotal) {
                discount = cartTotal;
            }

            return { valid: true, discount, voucher };
        } catch (err) {
            console.error('Error validating voucher:', err);
            return { valid: false, discount: 0, error: 'Failed to validate voucher' };
        }
    };

    return {
        vouchers,
        loading,
        error,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        validateVoucher,
        refreshVouchers: fetchVouchers
    };
};
