import React, { useContext } from "react";
import { ShopContext } from "../contexts/ShopContext";

const CartTotal = () => {
  const { currency, deliveryFee, getCartAmount } = useContext(ShopContext);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mt-2 text-sm ">
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>
            {currency}
            {getCartAmount()}.00
          </p>
        </div>
        <hr />
        <div>
          <div className="flex justify-between">
            <p>Shipping Fee</p>
            <p>
              {currency}
              {deliveryFee}.00
            </p>
          </div>
        </div>
        <hr />
        <div>
          <div className="flex justify-between">
            <b>Total</b>
            <b>
              {currency}
              {getCartAmount() === 0 ? 0 : getCartAmount() + deliveryFee}.00
            </b>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
