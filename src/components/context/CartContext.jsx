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
        // Load cart from localStorage for guest users
        loadCartFromLocalStorage();
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
        // Migrate localStorage cart to Firestore
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (localCart.length > 0) {
          await saveCartToFirestore(uid, localCart);
          setCartItems(localCart);
          localStorage.removeItem('cart');
        }
      }
    } catch (error) {
      console.error('Error loading cart from Firestore:', error);
      loadCartFromLocalStorage();
    }
  };

  // Load cart from localStorage (for guest users)
  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  };

  // Save cart to Firestore - THIS CREATES THE COLLECTION
  const saveCartToFirestore = async (uid, items) => {
    try {
      const cartRef = doc(db, 'carts', uid);
      const cartDoc = await getDoc(cartRef);

      if (cartDoc.exists()) {
        await updateDoc(cartRef, {
          items: items,
          updatedAt: new Date().toISOString()
        });
      } else {
        // This creates the 'carts' collection if it doesn't exist
        await setDoc(cartRef, {
          userId: uid,
          items: items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
    }
  };

  // Save cart to localStorage (for guest users)
  const saveCartToLocalStorage = (items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  // Sync cart function
  const syncCart = async (newItems) => {
    setCartItems(newItems);
    
    if (user) {
      await saveCartToFirestore(user.uid, newItems);
    } else {
      saveCartToLocalStorage(newItems);
    }
  };

  // Add to cart
  const addToCart = async (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    let newItems;
    if (existingItem) {
      newItems = cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newItems = [...cartItems, { ...product, quantity: 1 }];
    }
    
    await syncCart(newItems);
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    const newItems = cartItems.filter(item => item.id !== productId);
    await syncCart(newItems);
  };

  // Increase quantity
  const increaseQuantity = async (productId) => {
    const newItems = cartItems.map(item =>
      item.id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    await syncCart(newItems);
  };

  // Decrease quantity
  const decreaseQuantity = async (productId) => {
    const newItems = cartItems.map(item =>
      item.id === productId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    await syncCart(newItems);
  };

  // Update quantity
  const updateQuantity = async (productId, quantity) => {
    if (quantity === 0) {
      await removeFromCart(productId);
      return;
    }
    
    const newItems = cartItems.map(item =>
      item.id === productId
        ? { ...item, quantity: quantity }
        : item
    );
    await syncCart(newItems);
  };

  // Clear cart
  const clearCart = async () => {
    await syncCart([]);
  };

  // Get cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
