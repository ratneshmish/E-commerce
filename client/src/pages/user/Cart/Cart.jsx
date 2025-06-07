import CartItem from "./CartItem";
import EmptyCart from "./EmptyCart";
import { useCart } from "../../../context/cart";
import SaveForLater from "./SaveForLater";
import ScrollToTopOnRouteChange from "../../../utils/ScrollToTopOnRouteChange";
import SeoData from "../../../SEO/SeoData";
import PriceCard from "./PriceCard";
import { useAuth } from "../../../context/auth";
import axios from "axios";

const Cart = () => {
  const { auth } = useAuth();
  const [cartItems, setCartItems, , , saveLaterItems] = useCart();

  const frontendURL = window.location.origin;

  // Razorpay payment handler
  const handlePayment = async () => {
    try {
      // Call backend to create Razorpay order
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/payment/create-order`,
        {
          products: cartItems,
          customerEmail: auth?.user?.email,
          frontendURL,
        },
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );

      const { order } = data; // Your backend should return Razorpay order details here

      if (!order) {
        alert("Failed to create order. Please try again.");
        return;
      }

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, // Your Razorpay Key from env
        amount: order.amount,
        currency: order.currency,
        name: "Your Shop Name",
        description: "Purchase Description",
        order_id: order.id,
        handler: function (response) {
          // Payment success callback
          console.log("Payment success:", response);

          // Optionally notify backend about payment success
          axios.post(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/payment/payment-success`,
            {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id,
            },
            {
              headers: {
                Authorization: auth?.token,
              },
            }
          );

          // Redirect to order success page or show success message
          window.location.href = "/shipping/confirm";
        },
        prefill: {
          email: auth?.user?.email,
          // add more info if you want: name, contact, etc.
        },
        theme: {
          color: "#F37254",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <>
      <ScrollToTopOnRouteChange />
      <SeoData title="Shopping Cart | Flipkart.com" />
      <main className="w-full pt-5">
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-11/12 mt-0 sm:mt-4 m-auto ">
          <div className="flex-1">
            <div className="flex flex-col shadow bg-white">
              <span className="font-medium text-lg px-2 sm:px-8 py-4 border-b">
                My Cart ({cartItems?.length})
              </span>
              {cartItems?.length === 0 ? (
                <EmptyCart />
              ) : (
                cartItems?.map((item, i) => (
                  <CartItem product={item} inCart={true} key={i} />
                ))
              )}
              <div className="flex justify-between items-center sticky bottom-0 left-0 bg-white">
                <button
                  onClick={handlePayment}
                  disabled={cartItems.length < 1}
                  className={`${
                    cartItems.length < 1 ? "hidden" : "bg-orange"
                  } w-full sm:w-1/3 mx-2 sm:mx-6 my-4 py-4 font-medium text-white shadow hover:shadow-lg rounded-sm `}
                >
                  PLACE ORDER
                </button>
              </div>
            </div>

            <div className="flex flex-col mt-5 shadow bg-white mb-8">
              <span className="font-medium text-lg px-2 sm:px-8 py-4 border-b">
                Saved For Later ({saveLaterItems?.length})
              </span>
              {saveLaterItems?.map((item, i) => (
                <SaveForLater product={item} key={i} />
              ))}
            </div>
          </div>

          <PriceCard cartItems={cartItems} />
        </div>
      </main>
    </>
  );
};

export default Cart;
