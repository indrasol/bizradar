import React, { useState, useEffect } from 'react';
import { paymentApi } from '@/api/payment';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/Auth/useAuth';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentMethodManager() {
  const { user } = useAuth();
  const userId = user?.id;
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [defaultId, setDefaultId] = useState<string | null>(null);

  const fetchMethods = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await paymentApi.listPaymentMethods(userId);
      setMethods(data);
      const def = data.find((m: any) => m.customer && m.customer.invoice_settings && m.customer.invoice_settings.default_payment_method === m.id);
      setDefaultId(def ? def.id : (data[0]?.id || null));
    } catch (e) {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, [userId]);

  const handleRemove = async (id: string) => {
    if (!userId) return;
    await paymentApi.removePaymentMethod(id, userId);
    fetchMethods();
    toast.success('Payment method removed');
  };
  const handleSetDefault = async (id: string) => {
    if (!userId) return;
    await paymentApi.setDefaultPaymentMethod(id, userId);
    setDefaultId(id);
    fetchMethods();
    toast.success('Default payment method updated');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" /> Payment Methods
        </h3>
        <button
          onClick={() => setAddModal(true)}
          className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : methods.length === 0 ? (
        <div>No payment methods found.</div>
      ) : (
        <div className="space-y-4">
          {methods.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between border p-4 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{m.card.brand.toUpperCase()} ending in {m.card.last4}</div>
                <div className="text-gray-500 text-sm">Expires: {m.card.exp_month}/{m.card.exp_year}</div>
              </div>
              <div className="flex gap-2 items-center">
                {defaultId === m.id ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Primary</span>
                ) : (
                  <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleSetDefault(m.id)}>Set as default</button>
                )}
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => handleRemove(m.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Payment Method</h3>
              <button onClick={() => setAddModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <Elements stripe={stripePromise}>
              <AddCardForm onSuccess={() => { setAddModal(false); fetchMethods(); }} loading={addLoading} setLoading={setAddLoading} userId={userId} />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCardForm({ onSuccess, loading, setLoading, userId }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!stripe || !elements || !userId) return;
    setLoading(true);
    const cardElement = elements.getElement(CardElement);
    const clientSecret = await paymentApi.createSetupIntent(userId);
    const { setupIntent, error } = await stripe.confirmCardSetup(
      clientSecret,
      { payment_method: { card: cardElement } }
    );
    if (error) {
      toast.error(error.message || 'Failed to add card');
      setLoading(false);
      return;
    }
    await paymentApi.addPaymentMethod(setupIntent.payment_method as string, userId);
    toast.success('Card added');
    setLoading(false);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={{ hidePostalCode: true }} className="p-2 border rounded" />
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all">{loading ? 'Adding...' : 'Add Card'}</button>
    </form>
  );
}

export default PaymentMethodManager; 