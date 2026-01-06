import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFAQs } from '../hooks/useFAQs';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft, Sparkles } from 'lucide-react';

const FAQPage: React.FC = () => {
    const { faqs, loading, error } = useFAQs();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const activeFAQs = faqs.filter(faq => faq.active);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
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

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-4">
                <div className="text-center">
                    <HelpCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading FAQs</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-md border-b border-gold-300/30">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-700 hover:text-gold-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Shop</span>
                        </Link>
                        <img src="/logo.jpg" alt="HP GLOW" className="h-10 w-auto" />
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-2 mb-4">
                        <HelpCircle className="w-8 h-8 text-gold-600" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-black via-gray-800 to-gold-600 bg-clip-text text-transparent">
                            Frequently Asked Questions
                        </h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Find answers to common questions about our products, ordering process, shipping, and more.
                    </p>
                </div>

                {activeFAQs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gold-300/30">
                        <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No FAQs Available</h2>
                        <p className="text-gray-600">Check back later for frequently asked questions.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeFAQs.map((faq, index) => (
                            <div
                                key={faq.id}
                                className="bg-white rounded-xl shadow-lg border border-gold-300/30 overflow-hidden transition-all hover:shadow-xl"
                            >
                                <button
                                    onClick={() => toggleExpand(faq.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gold-50/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-gold-500 to-gold-600 text-black font-bold text-sm rounded-full">
                                            {index + 1}
                                        </span>
                                        <h3 className="font-semibold text-gray-900 text-sm md:text-base pr-4">
                                            {faq.question}
                                        </h3>
                                    </div>
                                    <div className={`flex-shrink-0 p-1 rounded-full ${expandedId === faq.id ? 'bg-gold-100' : 'bg-gray-100'} transition-colors`}>
                                        {expandedId === faq.id ? (
                                            <ChevronUp className="w-5 h-5 text-gold-600" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="px-6 pb-5 pt-2 border-t border-gold-100">
                                        <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact CTA */}
                <div className="mt-12 text-center bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl p-8 shadow-xl">
                    <Sparkles className="w-8 h-8 text-gold-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Still have questions?</h2>
                    <p className="text-gray-400 mb-6">
                        We're here to help! Reach out to us on Instagram or Viber.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="https://www.instagram.com/hpglowpeptides"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                            📸 Instagram
                        </a>
                        <a
                            href="viber://chat?number=%2B639062349763"
                            className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all border border-gold-300"
                        >
                            💬 Viber
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-16 border-t border-gold-200/30 bg-white py-8">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} HP GLOW Peptides. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default FAQPage;
