import paymentModel from '../models/paymentModel.js';
import cloudinary from '../configs/cloudinary.js';

// Get all payment methods
export const getAllPaymentMethods = async (req, res) => {
  try {
    const methods = await paymentModel.find().sort({ createdAt: -1 });
    res.json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active payment methods (for frontend checkout)
export const getActivePaymentMethods = async (req, res) => {
  try {
    const methods = await paymentModel.find({ isActive: true });
    res.json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update payment method
export const upsertPaymentMethod = async (req, res) => {
  try {
    const { name, qrCode, isActive } = req.body;
    
    // Check if payment method exists
    let paymentMethod = await paymentModel.findOne({ name });
    
    if (paymentMethod) {
      // Update existing
      if (qrCode && qrCode.startsWith('data:image')) {
        // Delete old QR from Cloudinary
        if (paymentMethod.qrCode) {
          try {
            const publicId = paymentMethod.qrCode.split('/').pop()?.split('.')[0];
            if (publicId) {
              await cloudinary.uploader.destroy(`gaming-store/payments/${publicId}`);
            }
          } catch (deleteError) {
            console.error('Cloudinary delete error:', deleteError);
          }
        }
        
        // Upload new QR
        const result = await cloudinary.uploader.upload(qrCode, {
          folder: 'gaming-store/payments',
          transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }]
        });
        paymentMethod.qrCode = result.secure_url;
      }
      
      if (isActive !== undefined) {
        paymentMethod.isActive = isActive;
      }
      
      await paymentMethod.save();
      
      res.json({ 
        success: true, 
        message: 'Payment method updated successfully',
        method: paymentMethod 
      });
    } else {
      // Create new
      const isCOD = name === 'Cash on Delivery';
      let qrImageUrl = '';
      
      if (qrCode && qrCode.startsWith('data:image')) {
        const result = await cloudinary.uploader.upload(qrCode, {
          folder: 'gaming-store/payments',
          transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }]
        });
        qrImageUrl = result.secure_url;
      }
      
      const newMethod = new paymentModel({
        name,
        qrCode: qrImageUrl,
        isActive: isActive !== undefined ? isActive : true,
        isCOD
      });
      
      await newMethod.save();
      
      res.status(201).json({ 
        success: true, 
        message: 'Payment method created successfully',
        method: newMethod 
      });
    }
  } catch (error) {
    console.error('Payment method error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const { name } = req.params;
    
    const paymentMethod = await paymentModel.findOne({ name });
    if (!paymentMethod) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment method not found' 
      });
    }

    // Delete QR code from Cloudinary
    if (paymentMethod.qrCode) {
      try {
        const publicId = paymentMethod.qrCode.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`gaming-store/payments/${publicId}`);
        }
      } catch (deleteError) {
        console.error('Cloudinary delete error:', deleteError);
      }
    }

    await paymentModel.findOneAndDelete({ name });
    res.json({ 
      success: true, 
      message: 'Payment method deleted successfully' 
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};