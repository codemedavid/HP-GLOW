import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { FAQ } from '../types';

interface UseFAQsReturn {
    faqs: FAQ[];
    loading: boolean;
    error: string | null;
    addFAQ: (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; data?: FAQ }>;
    updateFAQ: (id: string, updates: Partial<FAQ>) => Promise<{ success: boolean; error?: string; data?: FAQ }>;
    deleteFAQ: (id: string) => Promise<{ success: boolean; error?: string }>;
    reorderFAQs: (orderedIds: string[]) => Promise<{ success: boolean; error?: string }>;
    refreshFAQs: () => Promise<void>;
}

export const useFAQs = (): UseFAQsReturn => {
    const [faqs, setFAQs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFAQs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('faqs')
                .select('*')
                .order('sort_order', { ascending: true });

            if (fetchError) {
                throw fetchError;
            }

            setFAQs(data || []);
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch FAQs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFAQs();
    }, [fetchFAQs]);

    const addFAQ = async (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            // Get the highest sort_order
            const { data: maxOrderData } = await supabase
                .from('faqs')
                .select('sort_order')
                .order('sort_order', { ascending: false })
                .limit(1)
                .single();

            const newSortOrder = (maxOrderData?.sort_order || 0) + 1;

            const { data, error: insertError } = await supabase
                .from('faqs')
                .insert([{ ...faq, sort_order: faq.sort_order || newSortOrder }])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            setFAQs(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
            return { success: true, data };
        } catch (err) {
            console.error('Error adding FAQ:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to add FAQ' };
        }
    };

    const updateFAQ = async (id: string, updates: Partial<FAQ>) => {
        try {
            const { id: _, created_at, updated_at, ...updateData } = updates as any;

            const { data, error: updateError } = await supabase
                .from('faqs')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            setFAQs(prev => prev.map(f => f.id === id ? data : f).sort((a, b) => a.sort_order - b.sort_order));
            return { success: true, data };
        } catch (err) {
            console.error('Error updating FAQ:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update FAQ' };
        }
    };

    const deleteFAQ = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('faqs')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            setFAQs(prev => prev.filter(f => f.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to delete FAQ' };
        }
    };

    const reorderFAQs = async (orderedIds: string[]) => {
        try {
            // Update sort_order for each FAQ
            const updates = orderedIds.map((id, index) => ({
                id,
                sort_order: index + 1
            }));

            for (const update of updates) {
                const { error: updateError } = await supabase
                    .from('faqs')
                    .update({ sort_order: update.sort_order })
                    .eq('id', update.id);

                if (updateError) {
                    throw updateError;
                }
            }

            // Refresh to get updated data
            await fetchFAQs();
            return { success: true };
        } catch (err) {
            console.error('Error reordering FAQs:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to reorder FAQs' };
        }
    };

    return {
        faqs,
        loading,
        error,
        addFAQ,
        updateFAQ,
        deleteFAQ,
        reorderFAQs,
        refreshFAQs: fetchFAQs
    };
};
