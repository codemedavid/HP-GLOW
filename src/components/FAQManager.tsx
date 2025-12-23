import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, HelpCircle, ChevronUp, ChevronDown, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useFAQs } from '../hooks/useFAQs';
import type { FAQ } from '../types';

interface FAQManagerProps {
    onBack: () => void;
}

const FAQManager: React.FC<FAQManagerProps> = ({ onBack }) => {
    const { faqs, loading, addFAQ, updateFAQ, deleteFAQ, reorderFAQs, refreshFAQs } = useFAQs();
    const [showModal, setShowModal] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        active: true
    });

    const resetForm = () => {
        setFormData({
            question: '',
            answer: '',
            active: true
        });
        setEditingFAQ(null);
    };

    const handleAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFAQ(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            active: faq.active
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        setIsProcessing(true);
        const result = await deleteFAQ(id);
        setIsProcessing(false);

        if (!result.success) {
            alert(result.error || 'Failed to delete FAQ');
        }
    };

    const handleSave = async () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            alert('Please fill in both question and answer');
            return;
        }

        setIsProcessing(true);

        let result;
        if (editingFAQ) {
            result = await updateFAQ(editingFAQ.id, formData);
        } else {
            result = await addFAQ({
                ...formData,
                sort_order: faqs.length + 1
            });
        }

        setIsProcessing(false);

        if (result.success) {
            setShowModal(false);
            resetForm();
        } else {
            alert(result.error || 'Failed to save FAQ');
        }
    };

    const handleToggleActive = async (faq: FAQ) => {
        const result = await updateFAQ(faq.id, { active: !faq.active });
        if (!result.success) {
            alert(result.error || 'Failed to update FAQ');
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;

        const newOrder = [...faqs];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

        setIsProcessing(true);
        await reorderFAQs(newOrder.map(f => f.id));
        setIsProcessing(false);
    };

    const handleMoveDown = async (index: number) => {
        if (index === faqs.length - 1) return;

        const newOrder = [...faqs];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

        setIsProcessing(true);
        await reorderFAQs(newOrder.map(f => f.id));
        setIsProcessing(false);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshFAQs();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gold-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading FAQs... ✨</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
            {/* Header */}
            <div className="bg-white shadow-md border-b border-gold-300/30">
                <div className="max-w-6xl mx-auto px-3 sm:px-4">
                    <div className="flex items-center justify-between h-12 md:h-14">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={onBack}
                                className="text-gray-700 hover:text-gold-600 transition-colors flex items-center gap-1 group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs md:text-sm">Dashboard</span>
                            </button>
                            <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-black to-gray-900 bg-clip-text text-transparent">
                                ❓ FAQ Management
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white px-2 py-1 rounded-md font-medium text-xs shadow-sm hover:shadow transition-all flex items-center gap-1 disabled:opacity-50 border border-gold-500/20"
                            >
                                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black px-3 py-1.5 rounded-md font-medium text-xs shadow-sm hover:shadow transition-all flex items-center gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add FAQ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
                {faqs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gold-300/30">
                        <HelpCircle className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No FAQs Yet</h3>
                        <p className="text-gray-600 mb-4">Create frequently asked questions to help your customers.</p>
                        <button
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                        >
                            Add First FAQ
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div
                                key={faq.id}
                                className={`bg-white rounded-xl shadow-lg border transition-all ${faq.active ? 'border-gold-300/30' : 'border-red-200 bg-red-50/30'
                                    }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Reorder buttons */}
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0 || isProcessing}
                                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === faqs.length - 1 || isProcessing}
                                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
                                                        #{index + 1}
                                                    </span>
                                                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                                                        {faq.question}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleToggleActive(faq)}
                                                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${faq.active
                                                                ? 'text-green-700 hover:bg-green-100'
                                                                : 'text-red-700 hover:bg-red-100'
                                                            }`}
                                                        title={faq.active ? 'Active' : 'Inactive'}
                                                    >
                                                        {faq.active ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(faq)}
                                                        disabled={isProcessing}
                                                        className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(faq.id)}
                                                        disabled={isProcessing}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm whitespace-pre-wrap">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingFAQ ? '✏️ Edit FAQ' : '✨ New FAQ'}
                            </h2>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Question */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Question *
                                </label>
                                <input
                                    type="text"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    className="input-field"
                                    placeholder="How do I place an order?"
                                />
                            </div>

                            {/* Answer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Answer *
                                </label>
                                <textarea
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                    className="input-field min-h-[150px]"
                                    placeholder="Provide a helpful answer to the question..."
                                    rows={5}
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500"
                                    id="faq-active-toggle"
                                />
                                <label htmlFor="faq-active-toggle" className="text-sm font-medium text-gray-700">
                                    Active (visible on FAQ page)
                                </label>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 flex gap-2">
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="flex-1 py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black py-2 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isProcessing ? 'Saving...' : 'Save FAQ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FAQManager;
