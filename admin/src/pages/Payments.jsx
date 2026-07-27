import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
  Plus, Edit, Trash2, Loader2, 
  X, Eye, EyeOff, QrCode,
  Wallet, Smartphone, CreditCard, Landmark
} from 'lucide-react';
import DeleteModal from '../components/UI/DeleteModal';

// Import payment logos
import esewaLogo from '../assets/payments/esewa.png';
import khaltiLogo from '../assets/payments/khalti.png';
import fonepayLogo from '../assets/payments/fonepay.png';

const Payments = ({ token }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, name: '' });
  const [qrModal, setQrModal] = useState({ isOpen: false, name: '', qrCode: '' });
  const fileInputRef = useRef(null);
  
  const [qrImage, setQrImage] = useState(null);
  const [qrPreview, setQrPreview] = useState('');

  const paymentOptions = [
    'Cash on Delivery',
    'eSewa',
    'Khalti',
    'Mobile Banking',
    'FonePay'
  ];

  const paymentIcons = {
    'Cash on Delivery': Wallet,
    'eSewa': Smartphone,
    'Khalti': Smartphone,
    'Mobile Banking': Landmark,
    'FonePay': CreditCard
  };

  // Payment logos mapping
  const paymentLogos = {
    'eSewa': esewaLogo,
    'Khalti': khaltiLogo,
    'FonePay': fonepayLogo
  };

  const paymentColors = {
    'Cash on Delivery': { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600' },
    'eSewa': { bg: 'bg-emerald-50', border: 'border-emarald-200', icon: 'text-Emerald-600' },
    'Khalti': { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
    'Mobile Banking': { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
    'Fonepay': { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
  };

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + '/api/payment');
      if (response.data.success) {
        setPaymentMethods(response.data.methods || []);
      }
    } catch (error) {
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleQrImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result);
      setQrImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (name) => {
    if (name !== 'Cash on Delivery' && !qrImage) {
      toast.error('Please upload a QR code image');
      return;
    }

    setFormLoading(true);

    try {
      const response = await axios.post(
        backendUrl + '/api/payment',
        {
          name,
          qrCode: qrImage || '',
          isActive: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        fetchPaymentMethods();
      } else {
        toast.error(response.data.message || 'Failed to save payment method');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save payment method');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (name, currentStatus) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/payment',
        { 
          name, 
          isActive: !currentStatus 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(`Payment method ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchPaymentMethods();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    const { name } = deleteModal;
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.delete(
        backendUrl + '/api/payment/' + name,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Payment method deleted successfully!');
        setDeleteModal({ isOpen: false, name: '', loading: false });
        fetchPaymentMethods();
      } else {
        toast.error(response.data.message || 'Failed to delete');
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payment method');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const startEdit = (method) => {
    setEditingName(method.name);
    setQrPreview(method.qrCode || '');
    setQrImage(method.qrCode || '');
  };

  const resetForm = () => {
    setQrImage(null);
    setQrPreview('');
    setEditingName(null);
    setFormLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const existingNames = paymentMethods.map(m => m.name);
  const missingMethods = paymentOptions.filter(name => !existingNames.includes(name));

  // QR Modal Component
  const QRModal = () => {
    if (!qrModal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setQrModal({ isOpen: false, name: '', qrCode: '' })}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in duration-200">
          <button
            onClick={() => setQrModal({ isOpen: false, name: '', qrCode: '' })}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-1">
              {qrModal.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Uploaded QR code for {qrModal.name}</p>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 inline-block">
              <img 
                src={qrModal.qrCode} 
                alt={`${qrModal.name} QR Code`}
                className="w-56 h-56 object-contain"
              />
            </div>
            
            <button
              onClick={() => setQrModal({ isOpen: false, name: '', qrCode: '' })}
              className="mt-6 px-8 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
          <p className="text-sm text-gray-500">Manage payment methods for your store</p>
        </div>
      </div>

      {/* Add New Payment Methods */}
      {missingMethods.length > 0 && (
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            Add New Payment Methods
          </h4>
          <div className="flex flex-wrap gap-3">
            {missingMethods.map((name) => (
              <button
                key={name}
                onClick={() => startEdit({ name, qrCode: '' })}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition text-sm font-medium"
              >
                <Plus size={16} />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingName && (
        <div className="mb-8 p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-semibold text-gray-900">
              Configure {editingName}
            </h4>
            <button
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {editingName !== 'Cash on Delivery' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Image *
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageChange}
                  className="hidden"
                  id="qr-upload"
                  disabled={formLoading}
                />
                <label
                  htmlFor="qr-upload"
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition cursor-pointer text-sm font-medium"
                >
                  <QrCode size={16} />
                  Choose QR Code
                </label>
                {qrPreview && (
                  <div className="flex items-center gap-4">
                    <img 
                      src={qrPreview} 
                      alt="QR Code Preview" 
                      className="w-20 h-20 object-contain border rounded-xl p-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQrPreview('');
                        setQrImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Square image recommended, max 5MB</p>
            </div>
          )}

          <button
            onClick={() => handleSave(editingName)}
            disabled={formLoading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {formLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Payment Method'
            )}
          </button>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paymentMethods.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payment methods found</p>
          </div>
        ) : (
          paymentMethods.map((method) => {
            const Icon = paymentIcons[method.name] || Wallet;
            const colors = paymentColors[method.name] || { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600' };
            const isActive = method.isActive;
            const logo = paymentLogos[method.name];

            return (
              <div 
                key={method._id} 
                className={`group relative border rounded-2xl p-5 transition-all duration-200 ${
                  isActive 
                    ? `bg-white border-gray-200 hover:shadow-lg` 
                    : `bg-gray-50 border-gray-200 opacity-70`
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${colors.bg} ${isActive ? '' : 'opacity-50'}`}>
                    {logo ? (
                      <img 
                        src={logo} 
                        alt={method.name} 
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Icon size={22} className={colors.icon} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                  </div>
                </div>

                {/* QR Code Section */}
                {method.qrCode ? (
                  <div className="mb-4 flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <QrCode size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-600">QR Code uploaded</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQrModal({ 
                          isOpen: true, 
                          name: method.name, 
                          qrCode: method.qrCode 
                        })}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                        title="View QR Code"
                      >
                        <Eye size={16} />
                      </button>
                      {method.name !== 'Cash on Delivery' && (
                        <button
                          onClick={() => startEdit(method)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                          title="Update QR Code"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  method.name !== 'Cash on Delivery' && (
                    <div className="mb-4 flex items-center justify-between gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <QrCode size={18} className="text-yellow-600" />
                        <span className="text-sm text-yellow-700">No QR code uploaded</span>
                      </div>
                      <button
                        onClick={() => startEdit(method)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition"
                      >
                        <Plus size={14} />
                        Add QR
                      </button>
                    </div>
                  )
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-1 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => toggleStatus(method.name, method.isActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      isActive 
                        ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, name: method.name })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition ml-auto"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR Modal */}
      <QRModal />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, name: '', loading: false })}
        onConfirm={handleDelete}
        title="Payment Method"
        itemName={deleteModal.name}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default Payments;