import orderModel from "../../models/orderModel.js";
import mongoose from "mongoose";
import productModel from "../../models/productModel.js";

const handleSuccess = async (req, res) => {
  try {
    // Razorpay sends orderId, paymentId, signature from frontend after payment
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderItems } = req.body;

    if (!orderItems || !orderItems.length) {
      return res.status(400).send("No order items received from client!");
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send("Payment details missing!");
    }

    // Here you should verify the payment signature on your backend for security (done in verifyPayment route).
    // Assuming signature is verified already or verification done earlier.

    // Map order items
    const orderObject = orderItems.map(product => ({
      name: product.name,
      image: product.image,
      brandName: product.brandName,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: product.quantity,
      productId: new mongoose.Types.ObjectId(product.productId),
      seller: new mongoose.Types.ObjectId(product.seller),
    }));

    // Since Razorpay does not return shipping in the payment details, pass shipping info from frontend or save from order
    // Assuming frontend sends shipping info as well, add that to req.body if needed

    // Construct dummy shipping object or get from req.body if you send shipping info
    const shippingObject = req.body.shippingInfo || {
      address: "Not Provided",
      city: "Not Provided",
      state: "Not Provided",
      country: "Not Provided",
      pincode: "Not Provided",
      phoneNo: "Not Provided",
      landmark: "Not Provided",
    };

    // Construct order data
    const combinedOrder = {
      paymentId: razorpay_payment_id,
      products: orderObject,
      buyer: req.user._id,
      shippingInfo: shippingObject,
      amount: req.body.amount, // pass amount from frontend or calculate
    };

    const order = new orderModel(combinedOrder);
    await order.save();

    // Update stock
    for (const item of orderItems) {
      const product = await productModel.findById(item.productId);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      } else {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
    }

    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Error handling Razorpay payment success:", error);
    res.status(500).send("Error handling payment success");
  }
};

export default handleSuccess;
