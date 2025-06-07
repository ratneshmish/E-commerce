import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import states from "../../../utils/states";
import { toast } from "react-toastify";
import { useCart } from "../../../context/cart";
import { useAuth } from "../../../context/auth";
import axios from "axios";
import SeoData from "../../../SEO/SeoData";
import PriceCard from "./PriceCard";

const Shipping = () => {
  const Info = localStorage.getItem("shippingInfo");
  const shippingInfo = JSON.parse(Info);

  const [cartItems] = useCart();
  const { auth } = useAuth();

  const [address, setAddress] = useState(shippingInfo?.address || "");
  const [city, setCity] = useState(shippingInfo?.city || "");
  const [country] = useState("IN");
  const [state, setState] = useState(shippingInfo?.state || "");
  const [landmark, setLandmark] = useState(shippingInfo?.landmark || "");
  const [pincode, setPincode] = useState(shippingInfo?.pincode || "");
  const [phoneNo, setPhoneNo] = useState(shippingInfo?.phoneNo || "");

  const handlePayment = async (shippingInfo) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/payment/create-order`,
        {
          products: cartItems,
          customerEmail: auth?.user?.email,
          customerPhone: shippingInfo.phoneNo,
          customerName: auth?.user?.name,
          frontendURL: window.location.origin,
        },
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );

      const { order } = data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Flipkart Clone",
        description: "E-Commerce Transaction",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await axios.post(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/payment/verify-payment`,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderItems: cartItems,
              shippingInfo,
              amount: order.amount / 100,
            },
            {
              headers: {
                Authorization: auth?.token,
              },
            }
          );

          if (verifyRes.data.success) {
            toast.success("Payment Successful and Order Placed!");
            localStorage.removeItem("cart");
            window.location.href = "/shipping/confirm";
          } else {
            toast.error("Payment verification failed!");
          }
        },
        prefill: {
          name: auth?.user?.name || "",
          email: auth?.user?.email || "",
          contact: shippingInfo.phoneNo,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Payment Failed");
    }
  };

  const shippingSubmit = async (e) => {
    e.preventDefault();
    if (phoneNo.length !== 10) {
      toast.error("Invalid Mobile Number");
      return;
    }

    const shippingInfo = {
      address,
      city,
      country,
      state,
      landmark,
      pincode,
      phoneNo,
    };

    localStorage.setItem("shippingInfo", JSON.stringify(shippingInfo));
    await handlePayment(shippingInfo);
  };

  return (
    <>
      <SeoData title="Flipkart: Shipping Details" />
      <main className="w-full pt-8">
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-11/12 mx-0 px-2 sm:mx-8 mt-4 overflow-hidden">
          <div className="flex-1">
            <div className="w-full px-4 sm:px-0 bg-white py-5">
              <form
                onSubmit={shippingSubmit}
                autoComplete="off"
                className="flex flex-col justify-start gap-3 w-full sm:w-3/4 mx-1 sm:mx-8 my-4"
              >
                <TextField
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                  label="Address"
                  variant="outlined"
                  required
                />
                <div className="flex gap-6">
                  <TextField
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    type="number"
                    label="Pincode"
                    fullWidth
                    variant="outlined"
                    required
                  />
                  <TextField
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    type="number"
                    label="Phone No"
                    fullWidth
                    variant="outlined"
                    required
                  />
                </div>
                <div className="flex gap-6">
                  <TextField
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    label="City"
                    fullWidth
                    variant="outlined"
                    required
                  />
                  <TextField
                    label="Landmark (Optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </div>
                <div className="flex gap-6">
                  <FormControl fullWidth>
                    <InputLabel id="country-select">Country</InputLabel>
                    <Select
                      labelId="country-select"
                      id="country-select"
                      defaultValue={country}
                      disabled
                      label="Country"
                    >
                      <MenuItem value={"IN"}>India</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth disabled={!country}>
                    <InputLabel id="state-select">State</InputLabel>
                    <Select
                      labelId="state-select"
                      id="state-select"
                      value={state}
                      label="State"
                      onChange={(e) => setState(e.target.value)}
                      required
                    >
                      {states?.map((item) => (
                        <MenuItem key={item.code} value={item.code}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <button
                  type="submit"
                  className="bg-orange w-full sm:w-[40%] mt-4 py-3.5 px-2 text-md font-[500] text-white shadow hover:shadow-lg rounded-sm uppercase outline-none"
                >
                  Make Payment
                </button>
              </form>
            </div>
          </div>
          <PriceCard cartItems={cartItems} />
        </div>
      </main>
    </>
  );
};

export default Shipping;
