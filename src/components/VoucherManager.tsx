import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Tag, Percent, DollarSign, Calendar, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useVouchers } from '../hooks/useVouchers';
import type { Voucher } from '../types';

interface VoucherManagerProps {
    onBack: () => void;
}

const VoucherManager: React.FC<VoucherManagerProps> = ({ onBack }) => {
    const { vouchers, loading, addVoucher, updateVoucher, deleteVoucher, refreshVouchers } = useVouchers();
    const [showModal, setShowModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        max_discount: null as number | null,
        min_purchase_amount: 0,
        max_uses: null as number | null,
        expires_at: '',
        active: true
    });

    const resetForm = () => {
        setFormData({
            code: '',
            discount_type: 'percentage',
            discount_value: 0,
            max_discount: null,
            min_purchase_amount: 0,
            max_uses: null,
            expires_at: '',
            active: true
        });
        setEditingVoucher(null);
    };

    const handleAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setFormData({
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            max_discount: voucher.max_discount,
            min_purchase_amount: voucher.min_purchase_amount,
            max_uses: voucher.max_uses,
            expires_at: voucher.expires_at ? voucher.expires_at.split('T')[0] : '',
            active: voucher.active
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this voucher?')) return;

        setIsProcessing(true);
        const result = await deleteVoucher(id);
        setIsProcessing(false);

        if (!result.success) {
            alert(result.error || 'Failed to delete voucher');
        }
    };

    const handleSave = async () => {
        if (!formData.code.trim()) {
            alert('Please enter a voucher code');
            return;
        }
        if (formData.discount_value <= 0) {
            alert('Please enter a valid discount value');
            return;
        }

        setIsProcessing(true);

        const voucherData = {
            code: formData.code.toUpperCase().trim(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            max_discount: formData.discount_type === 'percentage' ? formData.max_discount : null,
            min_purchase_amount: formData.min_purchase_amount,
            max_uses: formData.max_uses,
            expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            active: formData.active
        };

        let result;
        if (editingVoucher) {
            result = await updateVoucher(editingVoucher.id, voucherData);
        } else {
            result = await addVoucher(voucherData);
        }

        setIsProcessing(false);

        if (result.success) {
            setShowModal(false);
            resetForm();
        } else {
            alert(result.error || 'Failed to save voucher');
        }
    };

    const handleToggleActive = async (voucher: Voucher) => {
        const result = await updateVoucher(voucher.id, { active: !voucher.active });
        if (!result.success) {
            alert(result.error || 'Failed to update voucher');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshVouchers();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gold-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading vouchers... ✨</p>
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
                                🏷️ Voucher Management
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
                                Add Voucher
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
                {vouchers.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gold-300/30">
                        <Tag className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Vouchers Yet</h3>
                        <p className="text-gray-600 mb-4">Create your first voucher to offer discounts to customers.</p>
                        <button
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                        >
                            Create Voucher
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gold-300/30 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gold-50 to-gray-50 border-b border-gold-300/30">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Discount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 hidden md:table-cell">Min Purchase</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 hidden lg:table-cell">Usage</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 hidden lg:table-cell">Expires</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vouchers.map((voucher) => (
                                        <tr key={voucher.id} className="hover:bg-gold-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                    {voucher.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {voucher.discount_type === 'percentage' ? (
                                                        <>
                                                            <Percent className="w-3 h-3 text-gold-600" />
                                                            <span className="font-semibold text-gray-900">{voucher.discount_value}%</span>
                                                            {voucher.max_discount && (
                                                                <span className="text-xs text-gray-500">(max ₱{voucher.max_discount.toLocaleString()})</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold text-gray-900">₱{voucher.discount_value.toLocaleString()}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-sm text-gray-600">
                                                    ₱{voucher.min_purchase_amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="text-sm text-gray-600">
                                                    {voucher.times_used}{voucher.max_uses ? `/${voucher.max_uses}` : ''}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className={`text-sm ${voucher.expires_at && new Date(voucher.expires_at) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {formatDate(voucher.expires_at)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleActive(voucher)}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${voucher.active
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {voucher.active ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3 h-3" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(voucher)}
                                                        disabled={isProcessing}
                                                        className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(voucher.id)}
                                                        disabled={isProcessing}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingVoucher ? '✏️ Edit Voucher' : '✨ New Voucher'}
                            </h2>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Voucher Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="input-field font-mono"
                                    placeholder="SAVE10"
                                />
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Type *
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all ${formData.discount_type === 'percentage'
                                                ? 'border-gold-500 bg-gold-50 text-gray-900'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <Percent className="w-4 h-4 inline mr-1" />
                                        Percentage
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all ${formData.discount_type === 'fixed'
                                                ? 'border-gold-500 bg-gold-50 text-gray-900'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        ₱ Fixed Amount
                                    </button>
                                </div>
                            </div>

                            {/* Discount Value */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Value *
                                </label>
                                <input
                                    type="number"
                                    value={formData.discount_value || ''}
                                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                    className="input-field"
                                    placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.discount_type === 'percentage' ? 'e.g., 10 for 10% off' : 'e.g., 100 for ₱100 off'}
                                </p>
                            </div>

                            {/* Max Discount (for percentage) */}
                            {formData.discount_type === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Discount Cap (₱)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max_discount || ''}
                                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value ? Number(e.target.value) : null })}
                                        className="input-field"
                                        placeholder="500 (leave empty for no cap)"
                                        min="0"
                                    />
                                </div>
                            )}

                            {/* Min Purchase */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Purchase (₱)
                                </label>
                                <input
                                    type="number"
                                    value={formData.min_purchase_amount || ''}
                                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: Number(e.target.value) })}
                                    className="input-field"
                                    placeholder="1000"
                                    min="0"
                                />
                            </div>

                            {/* Max Uses */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Uses
                                </label>
                                <input
                                    type="number"
                                    value={formData.max_uses || ''}
                                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })}
                                    className="input-field"
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>

                            {/* Expires At */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500"
                                    id="active-toggle"
                                />
                                <label htmlFor="active-toggle" className="text-sm font-medium text-gray-700">
                                    Active (can be used by customers)
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
                                {isProcessing ? 'Saving...' : 'Save Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherManager;
