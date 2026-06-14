import { XIcon } from 'lucide-react';
import React from 'react'

interface AddressFormProps {
    resetForm: () => void;
    handleSubmit: (e: React.FormEvent) => void;
    form: {
        label: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        isDefault: boolean;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        label: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        isDefault: boolean;
    }>>;
    editingId: string | null;
};

export function AddressForm({ resetForm, handleSubmit, form, setForm, editingId }: AddressFormProps) {
    return (
        <>
            {/* Overlay */}
            <div className='fixed inset-0 bg-black/40 z-50' />

            {/* Form Container */}
            <div onClick={resetForm} className='fixed inset-0 z-50 flex-center p-4'>
                <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className='bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in'>

                    {/* Form Header */}
                    <div className='flex items-center justify-between mb-5'>
                        <h2 className='text-lg font-semibold text-app-green'>{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                        <button type='button' onClick={resetForm} className='p-2 hover:bg-app-cream rounded-lg'>
                            <XIcon className='size-5' />
                        </button>
                    </div>

                    {/* Form input fields */}
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-app-green mb-1.5'>Address Label</label>
                            <input
                                onChange={(e) => setForm({ ...form, label: e.target.value })}
                                type="text"
                                placeholder='Home, Work, etc'
                                value={form.label}
                                className='w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none'
                                required
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-app-green mb-1.5'>Street Address</label>
                            <input
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                type="text"
                                value={form.address}
                                className='w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none'
                                required
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div>
                                <label className='block text-sm font-medium text-app-green mb-1.5'>City</label>
                                <input
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    type="text"
                                    value={form.city}
                                    className='w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none'
                                    required
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-app-green mb-1.5'>State</label>
                                <input
                                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    type="text"
                                    value={form.state}
                                    className='w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none'
                                    required
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div>
                                <label className='block text-sm font-medium text-app-green mb-1.5'>ZIP Code</label>
                                <input
                                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                                    type="text"
                                    value={form.zip}
                                    className='w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none'
                                    required
                                />
                            </div>
                            <div className='flex items-end pb-1'>
                                <label className='flex items-center gap-2 cursor-pointer'>
                                    <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                                    <span className='text-sm text-app-text'>Set as default</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    {/* Submit Button */}
                    <button type='submit' className='mt-6 w-full py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl hover:bg-app-green-light transition-colors'>
                        {editingId ? 'Update Address' : 'Add Address'}
                    </button>
                </form>
            </div>
        </>
    )
}
