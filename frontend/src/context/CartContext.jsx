import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const CartContext = createContext(null);

// The single frontend source of truth for the cart. Every mutation replaces cartItems
// with the cart the backend returns, so Navbar, Product cards and the Cart page always agree.
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/cart");
      setCartItems(response.data.cart);
    } catch (error) {
      setCartItems([]);
      // Not being logged in is not an error; it just means there is no cart yet.
      if (error.response?.status !== 401) {
        setError("Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialCart = async () => {
      try {
        const response = await api.get("/cart");
        setCartItems(response.data.cart);
      } catch (error) {
        if (error.response?.status !== 401) {
          setError("Unable to load your cart.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialCart();
  }, []);

  // Mutations throw so the calling component can show its own error message.
  const addToCart = useCallback(async (productId) => {
    const response = await api.post(`/cart/${productId}`);
    setCartItems(response.data.cart);
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const response = await api.patch(`/cart/${productId}`, { quantity });
    setCartItems(response.data.cart);
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    setCartItems(response.data.cart);
  }, []);

  // Used after a verified order (backend cart is already empty) and on logout.
  const clearCart = useCallback(() => {
    setCartItems([]);
    setError("");
  }, []);

  // Derived values are calculated from cartItems, never stored separately.
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      error,
      itemCount,
      subtotal,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [cartItems, loading, error, itemCount, subtotal, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}
