import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadCartFromFirestore(currentUser.uid);
      } else {
        // Clear cart and do not allow localStorage fallback to enforce login requirement
        setCartItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time sync with Firestore for logged-in users
  useEffect(() => {
    if (!user) return;

    const cartRef = doc(db, 'carts', user.uid);
    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        const cartData = docSnap.data();
        setCartItems(cartData.items || []);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Load cart from Firestore
  const loadCartFromFirestore = async (uid) => {
    try {
      const cartRef = doc(db, 'carts', uid);
      const cartDoc = await getDoc(cartRef);

      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        setCartItems(cartData.items || []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart from Firestore:', error);
      setCartItems([]);
    }
  };

  // Save cart to Firestore - creates collection if doesn't exist
  const saveCartToFirestore = async (uid, items) => {
    try {
      const cartRef = doc(db, 'carts', uid);
      const cartDoc = await getDoc(cartRef);

      if (cartDoc.exists()) {
        await updateDoc(cartRef, {
          items: items,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(cartRef, {
          userId: uid,
          items: items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
    }
  };

  // Sync cart function only for logged in users
  const syncCart = async (newItems) => {
    if (!user) {
      alert('Please log in to modify cart items');
      return;
    }
    setCartItems(newItems);
    await saveCartToFirestore(user.uid, newItems);
  };

  // Add to cart
  const addToCart = async (product) => {
    if (!user) {
      alert('Please log in to add items to cart');
      return;
    }
    const existingItem = cartItems.find((item) => item.id === product.id);

    let newItems;
    if (existingItem) {
      newItems = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...cartItems, { ...product, quantity: 1 }];
    }

    await syncCart(newItems);
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    if (!user) {
      alert('Please log in to modify cart items');
      return;
    }
    const newItems = cartItems.filter((item) => item.id !== productId);
    await syncCart(newItems);
  };

  // Increase quantity
  const increaseQuantity = async (productId) => {
    if (!user) {
      alert('Please log in to modify cart items');
      return;
    }
    const newItems = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
    );
    await syncCart(newItems);
  };

  // Decrease quantity
  const decreaseQuantity = async (productId) => {
    if (!user) {
      alert('Please log in to modify cart items');
      return;
    }
    const newItems = cartItems.map((item) =>
      item.id === productId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    await syncCart(newItems);
  };

  // Update quantity
  const updateQuantity = async (productId, quantity) => {
    if (!user) {
      alert('Please log in to modify cart items');
      return;
    }
    if (quantity === 0) {
      await removeFromCart(productId);
      return;
    }

    const newItems = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: quantity } : item
    );
    await syncCart(newItems);
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) {
      alert('Please log in to clear cart');
      return;
    }
    await syncCart([]);
  };

  // Get cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Get cart items count
  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
