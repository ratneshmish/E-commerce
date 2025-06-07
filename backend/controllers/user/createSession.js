import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createSession = async (req, res) => {
  try {
    console.log("Create Razorpay order body:", req.body);
    console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);

    const {
      products,
      customerEmail,
      customerPhone,
      customerName,
      frontendURL,
    } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products found in request.",
      });
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (
        typeof product.discountPrice !== "number" ||
        typeof product.quantity !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid product format at index ${i}`,
        });
      }
    }

    const totalAmount = products.reduce(
      (acc, item) => acc + item.discountPrice * item.quantity,
      0
    );

    console.log("Calculated totalAmount (₹):", totalAmount);

    if (totalAmount < 50) {
      return res.status(400).json({
        success: false,
        message: "Minimum amount must be ₹50 to create Razorpay order.",
      });
    }

    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: 1,
      notes: {
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      successURL: `${frontendURL}/shipping/confirm`,
      cancelURL: `${frontendURL}/shipping/failed`,
    });
  } catch (error) {
    console.error("Error in Razorpay createSession:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error,
    });
  }
};

export default createSession;
