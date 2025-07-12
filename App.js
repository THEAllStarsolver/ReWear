import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// Corrected import for Firestore functions
import { getFirestore, doc, getDoc, setDoc, collection, query, where, addDoc, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore'; // Added addDoc and deleteDoc here

// --- Firebase Configuration and Initialization ---
// These global variables are provided by the Canvas environment.
// For local development/deployment, we'll use fallback values or ensure they are explicitly defined.
// DO NOT modify them or prompt the user for them.

// Define these variables with fallback values for local development/deployment
// In a real production app, you would load these from environment variables or a config file.
const appId = process.env.REACT_APP_APP_ID || 'default-rewear-app-id'; // Use an environment variable or fallback
const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || '{}'); // Use an environment variable or fallback
const initialAuthToken = process.env.REACT_APP_INITIAL_AUTH_TOKEN || null; // Use an environment variable or fallback

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Utility Components ---

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

// Message Box Component (replaces alert/confirm)
const MessageBox = ({ message, type = 'info', onClose, onConfirm }) => {
  const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                  type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                  'bg-blue-100 border-blue-400 text-blue-700';
  const borderColor = type === 'error' ? 'border-red-500' :
                      type === 'success' ? 'border-green-500' :
                      'border-blue-500';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className={`relative ${bgColor} border ${borderColor} px-4 py-3 rounded-lg shadow-lg max-w-sm w-full`}>
        <p className="font-bold text-lg mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
        <p className="text-sm">{message}</p>
        <div className="mt-4 flex justify-end space-x-2">
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
            >
              Confirm
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out"
          >
            {onConfirm ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Page Components ---

// Login/Registration Page (Screen 1 & 2)
const AuthPage = ({ onAuthSuccess, showMessage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful!', 'success');
      } else {
        if (password !== confirmPassword) {
          showMessage('Passwords do not match!', 'error');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        showMessage('Registration successful!', 'success');
      }
      onAuthSuccess(); // Navigate to dashboard or landing page
    } catch (error) {
      console.error("Auth error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        showMessage(
          `Authentication failed: Email/Password sign-in is not enabled.
          Please go to Firebase Console > Authentication > Sign-in method tab and enable 'Email/Password' provider.`,
          'error'
        );
      } else {
        showMessage(`Authentication failed: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-200 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          {isLogin ? 'Welcome Back!' : 'Join ReWear'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="your@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="••••••••"
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="••••••••"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner /> : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
        {/* Optional: Social Login Buttons */}
        <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">Or continue with</p>
            <div className="flex justify-center space-x-4 mt-3">
                <button className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-200">
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12.0003 4.75C9.27433 4.75 7.00033 7.024 7.00033 9.75C7.00033 12.476 9.27433 14.75 12.0003 14.75C14.7263 14.75 17.0003 12.476 17.0003 9.75C17.0003 7.024 14.7263 4.75 12.0003 4.75ZM12.0003 16.25C8.04733 16.25 4.75033 19.547 4.75033 23.5H19.2503C19.2503 19.547 15.9533 16.25 12.0003 16.25Z" />
                    </svg>
                </button>
                <button className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-300 ease-in-out">
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.25 17.25h-1.5v-4.5H9.75v4.5h-1.5V6.75h1.5v4.5h3v-4.5h1.5v10.5z" />
                    </svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// Common Header Component
const Header = ({ onNavigate, userId, onLogout }) => (
  <header className="bg-white shadow-md py-4 px-6 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-40 rounded-b-lg">
    <div className="flex items-center mb-4 sm:mb-0">
      <h1 className="text-3xl font-extrabold text-purple-700 mr-6">ReWear</h1>
      <nav className="flex space-x-4">
        <button onClick={() => onNavigate('landing')} className="text-gray-700 hover:text-blue-600 font-medium transition duration-200">Home</button>
        <button onClick={() => onNavigate('browse')} className="text-gray-700 hover:text-blue-600 font-medium transition duration-200">Browse Items</button>
        {userId && (
          <>
            <button onClick={() => onNavigate('dashboard')} className="text-gray-700 hover:text-blue-600 font-medium transition duration-200">Dashboard</button>
            <button onClick={() => onNavigate('addItem')} className="text-gray-700 hover:text-blue-600 font-medium transition duration-200">List Item</button>
          </>
        )}
        {userId && userId.includes('admin') && ( // Simple admin check for demo
          <button onClick={() => onNavigate('admin')} className="text-gray-700 hover:text-blue-600 font-medium transition duration-200">Admin</button>
        )}
      </nav>
    </div>
    <div className="flex items-center space-x-4">
      <div className="relative w-full sm:w-auto">
        <input
          type="text"
          placeholder="Search items..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 w-full"
        />
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
      {userId ? (
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={() => onNavigate('auth')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out"
        >
          Login / Sign Up
        </button>
      )}
    </div>
  </header>
);

// Landing Page (Screen 3 & 4)
const LandingPage = ({ onNavigate }) => {
  const featuredItems = [
    { id: '1', name: 'Vintage Denim Jacket', image: 'https://placehold.co/400x300/E0F2F7/2C3E50?text=Jacket', description: 'Classic denim, perfect for all seasons.' },
    { id: '2', name: 'Summer Floral Dress', image: 'https://placehold.co/400x300/F0F8FF/2C3E50?text=Dress', description: 'Light and airy, ideal for sunny days.' },
    { id: '3', name: 'Cozy Knit Sweater', image: 'https://placehold.co/400x300/F5EEF8/2C3E50?text=Sweater', description: 'Warm and comfortable for chilly evenings.' },
    { id: '4', name: 'Sporty Track Pants', image: 'https://placehold.co/400x300/E8F8F5/2C3E50?text=Pants', description: 'Great for workouts or casual wear.' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg mb-12">
          <h2 className="text-5xl font-extrabold mb-4 leading-tight">
            Give Your Clothes a Second Life
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Exchange unused clothing directly or earn points for sustainable fashion.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => onNavigate('browse')}
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-lg"
            >
              Browse Items
            </button>
            <button
              onClick={() => onNavigate('addItem')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-lg"
            >
              List an Item
            </button>
          </div>
        </section>

        {/* Featured Items Carousel */}
        <section className="mb-12">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-8">Featured Swaps</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out cursor-pointer"
                   onClick={() => onNavigate('itemDetail', { itemId: item.id })}>
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover"/>
                <div className="p-4">
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">{item.name}</h4>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Section (Placeholder) */}
        <section className="mb-12">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-8">Explore Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear'].map(category => (
              <div key={category} className="bg-white p-6 rounded-lg shadow-md text-center transform hover:scale-105 transition duration-300 ease-in-out cursor-pointer">
                <p className="text-xl font-semibold text-gray-700">{category}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials/Impact Metrics (Optional) */}
        <section className="text-center py-12 bg-gray-100 rounded-xl shadow-inner">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">Our Impact</h3>
          <div className="flex flex-col sm:flex-row justify-around items-center space-y-6 sm:space-y-0">
            <div className="text-center">
              <p className="text-5xl font-extrabold text-green-600">1000+</p>
              <p className="text-gray-700 text-lg">Items Swapped</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-extrabold text-yellow-600">5000+</p>
              <p className="text-gray-700 text-lg">Points Earned</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-extrabold text-blue-600">500+</p>
              <p className="text-gray-700 text-lg">Happy Users</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Browse Items Page (Screen 5)
const BrowseItemsPage = ({ onNavigate, showMessage }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/items`);
        const q = query(itemsCollectionRef, where("status", "==", "available")); // Only show available items
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort items by a relevant field if needed, e.g., creation date
          setItems(fetchedItems);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching items:", error);
          // Check for permission error specifically
          if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            showMessage(
              `Permission Denied: To view items, please update your Firestore Security Rules.
              Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

              rules_version = '2';
              service cloud.firestore {
                match /databases/{database}/documents {
                  match /artifacts/{appId}/public/data/items/{document=**} {
                    allow read, write: if request.auth != null;
                  }
                  match /artifacts/{appId}/users/{userId}/{document=**} {
                    allow read, write: if request.auth != null && request.auth.uid == userId;
                  }
                }
              }`, 'error'
            );
          } else {
            showMessage(`Error loading items: ${error.message}`, 'error');
          }
          setLoading(false);
        });
        return () => unsubscribe(); // Cleanup listener on unmount
      } catch (error) {
        console.error("Error setting up item listener:", error);
        showMessage(`Failed to set up item listener: ${error.message}`, 'error');
        setLoading(false);
      }
    };

    fetchItems();
  }, [showMessage]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
          Discover Pre-Loved Fashion
        </h2>
        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No items available for swap or redemption yet. Be the first to list one!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transform hover:scale-105 transition duration-300 ease-in-out cursor-pointer"
                   onClick={() => onNavigate('itemDetail', { itemId: item.id })}>
                <img
                  src={item.images?.[0] || `https://placehold.co/400x300/E0F2F7/2C3E50?text=${item.title.split(' ')[0] || 'Item'}`}
                  alt={item.title}
                  className="w-full h-56 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/E0F2F7/2C3E50?text=${item.title.split(' ')[0] || 'Item'}`; }}
                />
                <div className="p-5">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 truncate">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-700">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {item.category}
                    </span>
                    <span className="font-semibold">{item.pointsValue ? `${item.pointsValue} Pts` : 'Swap'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Item Detail Page (Screen 7)
const ItemDetailPage = ({ itemId, currentUserId, onNavigate, showMessage }) => {
  const [item, setItem] = useState(null);
  const [uploader, setUploader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmSwap, setShowConfirmSwap] = useState(false);
  const [showConfirmRedeem, setShowConfirmRedeem] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const itemDocRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
        const itemSnap = await getDoc(itemDocRef);

        if (itemSnap.exists()) {
          const itemData = { id: itemSnap.id, ...itemSnap.data() };
          setItem(itemData);

          // Fetch uploader info
          const uploaderDocRef = doc(db, `artifacts/${appId}/users`, itemData.userId);
          const uploaderSnap = await getDoc(uploaderDocRef);
          if (uploaderSnap.exists()) {
            setUploader(uploaderSnap.data());
          }
        } else {
          showMessage('Item not found.', 'error');
          onNavigate('browse'); // Redirect if item doesn't exist
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        // Check for permission error specifically
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
          showMessage(
            `Permission Denied: To view item details, please update your Firestore Security Rules.
            Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                match /artifacts/{appId}/public/data/items/{document=**} {
                  allow read, write: if request.auth != null;
                }
                match /artifacts/{appId}/users/{userId}/{document=**} {
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                }
              }
            }`, 'error'
          );
        } else {
          showMessage(`Error loading item details: ${error.message}`, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetails();
    }
  }, [itemId, onNavigate, showMessage]);

  const handleSwapRequest = async () => {
    if (!currentUserId) {
      showMessage('Please log in to request a swap.', 'info');
      onNavigate('auth');
      return;
    }
    if (currentUserId === item.userId) {
      showMessage('You cannot swap your own item.', 'info');
      return;
    }

    setShowConfirmSwap(true);
  };

  const confirmSwap = async () => {
    setShowConfirmSwap(false);
    setLoading(true);
    try {
      // In a real app, this would involve creating a 'swap request' document
      // and notifying the owner. For this hackathon demo, we'll simulate.
      // A more robust system would need a 'swaps' collection and complex logic.
      showMessage('Swap request sent successfully! The item owner will be notified.', 'success');
      // Update item status or add to a 'pending swaps' list for the owner
    } catch (error) {
      console.error("Error sending swap request:", error);
      showMessage(`Failed to send swap request: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!currentUserId) {
      showMessage('Please log in to redeem points.', 'info');
      onNavigate('auth');
      return;
    }
    if (currentUserId === item.userId) {
      showMessage('You cannot redeem points for your own item.', 'info');
      return;
    }
    if (!item.pointsValue) {
      showMessage('This item is not available for point redemption.', 'info');
      return;
    }

    // Check user's points balance
    const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists() || userSnap.data().points < item.pointsValue) {
      showMessage('Not enough points to redeem this item.', 'error');
      return;
    }

    setShowConfirmRedeem(true);
  };

  const confirmRedeem = async () => {
    setShowConfirmRedeem(false);
    setLoading(true);
    try {
      // In a real app, this would involve deducting points, updating item status,
      // and creating a 'redemption' record.
      showMessage(`Successfully redeemed ${item.pointsValue} points for this item!`, 'success');
      // Simulate point deduction and item status update
      // await updateDoc(doc(db, `artifacts/${appId}/users`, currentUserId), {
      //   points: increment(-item.pointsValue)
      // });
      // await updateDoc(doc(db, `artifacts/${appId}/public/data/items`, itemId), {
      //   status: 'redeemed'
      // });
    } catch (error) {
      console.error("Error redeeming item:", error);
      showMessage(`Failed to redeem item: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (!item) {
    return <p className="text-center text-gray-600 text-lg mt-8">Item details could not be loaded.</p>;
  }

  const isOwner = currentUserId === item.userId;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate('browse')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition duration-200 font-medium"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Browse
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Image Gallery */}
          <div className="md:w-1/2">
            <img
              src={item.images?.[0] || `https://placehold.co/600x450/E0F2F7/2C3E50?text=${item.title.split(' ')[0] || 'Item'}`}
              alt={item.title}
              className="w-full h-96 object-cover rounded-lg shadow-md mb-4"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x450/E0F2F7/2C3E50?text=${item.title.split(' ')[0] || 'Item'}`; }}
            />
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {item.images && item.images.slice(1).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${item.title} thumbnail ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-md border border-gray-200 cursor-pointer hover:border-blue-500 transition duration-200"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/E0F2F7/2C3E50?text=Img${index+1}`; }}
                />
              ))}
            </div>
          </div>

          {/* Item Details */}
          <div className="md:w-1/2">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{item.title}</h1>
            <p className="text-2xl font-semibold text-purple-700 mb-4">
              {item.pointsValue ? `${item.pointsValue} Points` : 'Available for Swap'}
            </p>

            <div className="mb-6 text-gray-700">
              <p className="text-lg font-medium mb-2">Description:</p>
              <p className="text-base leading-relaxed">{item.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-gray-700">
              <div>
                <p className="font-medium">Category:</p>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{item.category}</span>
              </div>
              <div>
                <p className="font-medium">Type:</p>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{item.type}</span>
              </div>
              <div>
                <p className="font-medium">Size:</p>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">{item.size}</span>
              </div>
              <div>
                <p className="font-medium">Condition:</p>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">{item.condition}</span>
              </div>
            </div>

            <div className="mb-6 text-gray-700">
              <p className="font-medium">Tags:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {item.tags && item.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6 text-gray-700">
              <p className="font-medium">Uploader Info:</p>
              <p className="text-base">{uploader ? uploader.email : 'Unknown User'}</p>
              <p className="text-sm text-gray-500">Member since: {uploader?.memberSince || 'N/A'}</p>
            </div>

            {!isOwner && item.status === 'available' && (
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleSwapRequest}
                  className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Swap Request
                </button>
                {item.pointsValue && (
                  <button
                    onClick={handleRedeemPoints}
                    className="w-full sm:w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Redeem via Points
                  </button>
                )}
              </div>
            )}
            {isOwner && (
                <div className="mt-8">
                    <p className="text-lg font-semibold text-green-600">This is your item.</p>
                    {/* Add options for owner to edit/remove item */}
                </div>
            )}
            {item.status !== 'available' && (
                <div className="mt-8">
                    <p className="text-lg font-semibold text-red-600">Status: {item.status.toUpperCase()}</p>
                </div>
            )}
          </div>
        </div>

        {/* Previous Listings (Placeholder - could be related items) */}
        <section className="mt-12">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-8">You Might Also Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Placeholder for similar items */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <img src={`https://placehold.co/400x300/F0F8FF/2C3E50?text=Related+Item+${i}`} alt={`Related Item ${i}`} className="w-full h-48 object-cover"/>
                <div className="p-4">
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">Related Item {i}</h4>
                  <p className="text-gray-600 text-sm">Short description of related item.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showConfirmSwap && (
        <MessageBox
          message="Are you sure you want to send a swap request for this item?"
          type="info"
          onClose={() => setShowConfirmSwap(false)}
          onConfirm={confirmSwap}
        />
      )}
      {showConfirmRedeem && (
        <MessageBox
          message={`Are you sure you want to redeem this item for ${item.pointsValue} points? This action cannot be undone.`}
          type="info"
          onClose={() => setShowConfirmRedeem(false)}
          onConfirm={confirmRedeem}
        />
      )}
    </div>
  );
};

// Add New Item Page (Partially Screen 7, and feature description)
const AddItemPage = ({ currentUserId, onNavigate, showMessage }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [tags, setTags] = useState('');
  const [pointsValue, setPointsValue] = useState('');
  const [images, setImages] = useState([]); // Array of image URLs
  const [loading, setLoading] = useState(false);

  // Mock image upload function (in a real app, this would upload to cloud storage like Firebase Storage)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      showMessage('You can upload a maximum of 5 images.', 'error');
      return;
    }
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImages(prevImages => [...prevImages, ...newImageUrls]);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      showMessage('You must be logged in to list an item.', 'error');
      onNavigate('auth');
      return;
    }
    setLoading(true);

    try {
      const newItem = {
        userId: currentUserId,
        title,
        description,
        category,
        type,
        size,
        condition,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        pointsValue: pointsValue ? parseInt(pointsValue, 10) : null,
        images: images, // In a real app, these would be uploaded URLs
        status: 'available', // Default status
        createdAt: new Date().toISOString(),
      };

      const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/items`);
      await addDoc(itemsCollectionRef, newItem);
      showMessage('Item listed successfully!', 'success');
      onNavigate('dashboard'); // Redirect to dashboard after listing
    } catch (error) {
      console.error("Error adding document: ", error);
      // Check for permission error specifically
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        showMessage(
          `Permission Denied: To list items, please update your Firestore Security Rules.
          Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /artifacts/{appId}/public/data/items/{document=**} {
                allow read, write: if request.auth != null;
              }
              match /artifacts/{appId}/users/{userId}/{document=**} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
            }
          }`, 'error'
        );
      } else {
        showMessage(`Failed to list item: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
          List a New Clothing Item
        </h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          {/* Image Upload Section */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-2">Upload Images (Max 5)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition duration-200 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="block cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="mt-1 text-sm text-gray-600">Drag and drop or <span className="font-medium text-blue-600">browse</span> to upload</p>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`Uploaded ${index}`} className="w-full h-32 object-cover rounded-md shadow-sm border border-gray-200"/>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Item Details Form */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                   placeholder="e.g., Blue Denim Jeans"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="Describe your item, its condition, and any unique features."></textarea>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200">
                <option value="">Select Category</option>
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Dresses">Dresses</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Accessories">Accessories</option>
                <option value="Footwear">Footwear</option>
              </select>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input type="text" id="type" value={type} onChange={(e) => setType(e.target.value)} required
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                     placeholder="e.g., T-Shirt, Skirt, Jacket"/>
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input type="text" id="size" value={size} onChange={(e) => setSize(e.target.value)} required
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                     placeholder="e.g., M, L, UK 10, US 8"/>
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200">
                <option value="">Select Condition</option>
                <option value="New with tags">New with tags</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                     placeholder="e.g., casual, summer, cotton"/>
            </div>
            <div>
              <label htmlFor="pointsValue" className="block text-sm font-medium text-gray-700 mb-1">Points Value (Optional, for redemption)</label>
              <input type="number" id="pointsValue" value={pointsValue} onChange={(e) => setPointsValue(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                     placeholder="e.g., 100"/>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner /> : 'List Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

// User Dashboard Page (Screen 6)
const UserDashboardPage = ({ currentUserId, onNavigate, showMessage }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [mySwaps, setMySwaps] = useState([]); // Placeholder for swaps
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            // If user profile doesn't exist, create a basic one
            setDoc(userDocRef, { email: auth.currentUser.email, points: 0, memberSince: new Date().toLocaleDateString() }, { merge: true });
            setUserProfile({ email: auth.currentUser.email, points: 0, memberSince: new Date().toLocaleDateString() });
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          // Check for permission error specifically
          if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            showMessage(
              `Permission Denied: To view your profile, please update your Firestore Security Rules.
              Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

              rules_version = '2';
              service cloud.firestore {
                match /databases/{database}/documents {
                  match /artifacts/{appId}/public/data/items/{document=**} {
                    allow read, write: if request.auth != null;
                  }
                  match /artifacts/{appId}/users/{userId}/{document=**} {
                    allow read, write: if request.auth != null && request.auth.uid == userId;
                  }
                }
              }`, 'error'
            );
          } else {
            showMessage(`Error loading profile: ${error.message}`, 'error');
          }
        });

        // Fetch user's listings
        const itemsCollectionRef = collection(db, `artifacts/${appId}/public/data/items`);
        const qListings = query(itemsCollectionRef, where("userId", "==", currentUserId));
        const unsubscribeListings = onSnapshot(qListings, (snapshot) => {
          const fetchedListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyListings(fetchedListings);
        }, (error) => {
          console.error("Error fetching user listings:", error);
          // Check for permission error specifically
          if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            showMessage(
              `Permission Denied: To view your listings, please update your Firestore Security Rules.
              Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

              rules_version = '2';
              service cloud.firestore {
                match /databases/{database}/documents {
                  match /artifacts/{appId}/public/data/items/{document=**} {
                    allow read, write: if request.auth != null;
                  }
                  match /artifacts/{appId}/users/{userId}/{document=**} {
                    allow read, write: if request.auth != null && request.auth.uid == userId;
                  }
                }
              }`, 'error'
            );
          } else {
            showMessage(`Error loading your listings: ${error.message}`, 'error');
          }
        });

        // Placeholder for fetching swaps (requires a 'swaps' collection)
        // const swapsCollectionRef = collection(db, `artifacts/${appId}/public/data/swaps`);
        // const qSwaps = query(swapsCollectionRef, where("requesterId", "==", currentUserId));
        // const unsubscribeSwaps = onSnapshot(qSwaps, (snapshot) => {
        //   const fetchedSwaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        //   setMySwaps(fetchedSwaps);
        // }, (error) => {
        //   console.error("Error fetching user swaps:", error);
        //   showMessage(`Error loading your swaps: ${error.message}`, 'error');
        // });

        setLoading(false);
        return () => {
          unsubscribeUser();
          unsubscribeListings();
          // unsubscribeSwaps();
        };
      } catch (error) {
        console.error("Error setting up dashboard listeners:", error);
        showMessage(`Failed to load dashboard: ${error.message}`, 'error');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUserId, showMessage]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userProfile) {
    return <p className="text-center text-gray-600 text-lg mt-8">Please log in to view your dashboard.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
          Your ReWear Dashboard
        </h2>

        {/* Profile Details and Points Balance */}
        <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-6xl font-bold overflow-hidden border-4 border-blue-200">
            {userProfile.email ? userProfile.email[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-grow text-center md:text-left">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{userProfile.email}</h3>
            <p className="text-gray-600 text-lg mb-2">Member since: {userProfile.memberSince}</p>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full inline-block font-semibold text-xl shadow-sm">
              Current Points: {userProfile.points}
            </div>
            <p className="text-sm text-gray-500 mt-2">Your points can be used to redeem items.</p>
            {currentUserId && (
              <p className="text-sm text-gray-500 mt-2">Your User ID: <span className="font-mono break-all text-blue-700">{currentUserId}</span></p>
            )}
          </div>
        </section>

        {/* My Listings */}
        <section className="mb-10">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">My Listings</h3>
          {myListings.length === 0 ? (
            <p className="text-gray-600 text-lg">You haven't listed any items yet. <button onClick={() => onNavigate('addItem')} className="text-blue-600 hover:underline">List your first item!</button></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {myListings.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transform hover:scale-105 transition duration-300 ease-in-out cursor-pointer"
                     onClick={() => onNavigate('itemDetail', { itemId: item.id })}>
                  <img
                    src={item.images?.[0] || `https://placehold.co/400x300/E0F2F7/2C3E50?text=${item.title.split(' ')[0] || 'Item'}`}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/E0F2F7/2C3E50?text=${item.title.split(' ')[0] || 'Item'}`; }}
                  />
                  <div className="p-4">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 truncate">{item.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">Status: <span className={`font-medium ${item.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>{item.status.toUpperCase()}</span></p>
                    <div className="flex justify-between items-center text-sm text-gray-700">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {item.category}
                      </span>
                      <span className="font-semibold">{item.pointsValue ? `${item.pointsValue} Pts` : 'Swap'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Swaps/Redemptions (Placeholder) */}
        <section>
          <h3 className="text-3xl font-bold text-gray-800 mb-6">My Swaps & Redemptions</h3>
          {mySwaps.length === 0 ? (
            <p className="text-gray-600 text-lg">No ongoing or completed swaps/redemptions yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {/* Render swap/redemption cards here */}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Admin Panel Page (Admin Role)
const AdminPanelPage = ({ showMessage }) => {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'listings', 'orders'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
        const usersSnapshot = await getDocs(usersCollectionRef);
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching admin data:", error);
        // Check for permission error specifically
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
          showMessage(
            `Permission Denied: To access admin data, please update your Firestore Security Rules.
            Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                match /artifacts/{appId}/public/data/items/{document=**} {
                  allow read, write: if request.auth != null;
                }
                match /artifacts/{appId}/users/{userId}/{document=**} {
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                }
              }
            }`, 'error'
          );
        } else {
          showMessage(`Error loading admin data: ${error.message}`, 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showMessage]);

  const handleModerateListing = async (listingId, action) => {
    setLoading(true);
    try {
      const itemDocRef = doc(db, `artifacts/${appId}/public/data/items`, listingId);
      await setDoc(itemDocRef, { status: action === 'approve' ? 'available' : 'rejected' }, { merge: true });
      showMessage(`Listing ${listingId} ${action === 'approve' ? 'approved' : 'rejected'} successfully!`, 'success');
      // Refresh listings
      const listingsCollectionRef = collection(db, `artifacts/${appId}/public/data/items`);
      const listingsSnapshot = await getDocs(listingsCollectionRef);
      setListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error moderating listing:", error);
      showMessage(`Failed to moderate listing: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userIdToDelete) => {
    setLoading(true);
    try {
      // In a real app, you'd also delete their listings and other associated data
      await deleteDoc(doc(db, `artifacts/${appId}/users`, userIdToDelete));
      showMessage(`User ${userIdToDelete} deleted successfully!`, 'success');
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userIdToDelete));
    } catch (error) {
      console.error("Error deleting user:", error);
      showMessage(`Failed to delete user: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
          Admin Panel
        </h2>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-6 text-lg font-medium ${activeTab === 'users' ? 'border-b-4 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} transition duration-200`}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-3 px-6 text-lg font-medium ${activeTab === 'listings' ? 'border-b-4 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} transition duration-200`}
            >
              Manage Listings
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-6 text-lg font-medium ${activeTab === 'orders' ? 'border-b-4 border-blue-600 text-blue-700' : 'text-gray-600 hover:text-gray-800'} transition duration-200`}
            >
              Manage Orders (Placeholder)
            </button>
          </div>

          {activeTab === 'users' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Registered Users</h3>
              {users.length === 0 ? (
                <p className="text-gray-600">No users found.</p>
              ) : (
                <div className="space-y-4">
                  {users.map(user => (
                    <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center border border-gray-200">
                      <div className="flex items-center mb-4 sm:mb-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mr-4">
                          {user.email ? user.email[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">User ID: <span className="font-mono text-xs break-all">{user.id}</span></p>
                          <p className="text-sm text-gray-600">Points: {user.points || 0}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => showMessage(`View details for ${user.email}`, 'info')}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm shadow-sm transition duration-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm shadow-sm transition duration-200"
                        >
                          Delete User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">All Listings</h3>
              {listings.length === 0 ? (
                <p className="text-gray-600">No listings found.</p>
              ) : (
                <div className="space-y-4">
                  {listings.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center border border-gray-200">
                      <div className="flex items-center mb-4 sm:mb-0">
                        <img
                          src={item.images?.[0] || `https://placehold.co/80x80/E0F2F7/2C3E50?text=Item`}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-md mr-4"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/80x80/E0F2F7/2C3E50?text=Item`; }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900 truncate max-w-xs">{item.title}</p>
                          <p className="text-sm text-gray-600">Uploader: {item.userId}</p>
                          <p className="text-sm text-gray-600">Status: <span className={`font-medium ${item.status === 'available' ? 'text-green-600' : item.status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>{item.status.toUpperCase()}</span></p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {item.status !== 'available' && (
                          <button
                            onClick={() => handleModerateListing(item.id, 'approve')}
                            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm shadow-sm transition duration-200"
                          >
                            Approve
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerateListing(item.id, 'reject')}
                            className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md text-sm shadow-sm transition duration-200"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => showMessage(`Remove item ${item.title}`, 'info')}
                          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm shadow-sm transition duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Manage Orders (Swaps/Redemptions)</h3>
              <p className="text-gray-600">This section would list and allow management of swap requests and point redemptions.</p>
              {/* Implement logic to fetch and display orders */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'auth', 'landing', 'browse', 'itemDetail', 'addItem', 'dashboard', 'admin'
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [userId, setUserId] = useState(null); // Firebase User ID
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [messageBox, setMessageBox] = useState(null); // { message, type, onClose, onConfirm }

  // Firebase Auth Listener and Initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // For local development, we sign in anonymously if no initialAuthToken is provided.
        // This allows the app to function without requiring a user to explicitly log in first.
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase initial sign-in error:", error);
        if (error.code === 'auth/operation-not-allowed') {
          showMessageBox(
            `Authentication failed: Anonymous sign-in is not enabled.
            Please go to Firebase Console > Authentication > Sign-in method tab and enable 'Anonymous' provider.`,
            'error'
          );
        } else {
          showMessageBox(`Failed to sign in: ${error.message}`, 'error');
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        console.log("Current User ID:", user.uid); // Log user ID for debugging
        // Ensure user profile exists in Firestore
        const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
        getDoc(userDocRef).then(docSnap => {
          if (!docSnap.exists()) {
            setDoc(userDocRef, {
              email: user.email || 'anonymous@rewear.com',
              points: 0,
              memberSince: new Date().toLocaleDateString(),
            }, { merge: true });
          }
        }).catch(error => {
          console.error("Error ensuring user profile:", error);
          // Check for permission error specifically
          if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
            showMessageBox(
              `Permission Denied: To manage user profiles, please update your Firestore Security Rules.
              Go to Firebase Console > Firestore Database > Rules tab and add the following rules:

              rules_version = '2';
              service cloud.firestore {
                match /databases/{database}/documents {
                  match /artifacts/{appId}/public/data/items/{document=**} {
                    allow read, write: if request.auth != null;
                  }
                  match /artifacts/{appId}/users/{userId}/{document=**} {
                    allow read, write: if request.auth != null && request.auth.uid == userId;
                  }
                }
              }`, 'error'
            );
          }
        });
      } else {
        setUserId(null);
      }
      setIsAuthReady(true);
    });

    initializeAuth();
    return () => unsubscribe(); // Cleanup auth listener
  }, []);

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    if (page === 'itemDetail' && params.itemId) {
      setSelectedItemId(params.itemId);
    } else {
      setSelectedItemId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showMessageBox('Logged out successfully!', 'success');
      handleNavigate('landing'); // Go to landing page after logout
    } catch (error) {
      console.error("Logout error:", error);
      showMessageBox(`Logout failed: ${error.message}`, 'error');
    }
  };

  const showMessageBox = (message, type = 'info', onConfirm = null) => {
    setMessageBox({ message, type, onClose: () => setMessageBox(null), onConfirm });
  };

  // Render current page based on state
  const renderPage = () => {
    if (!isAuthReady) {
      return <LoadingSpinner />;
    }

    switch (currentPage) {
      case 'auth':
        return <AuthPage onAuthSuccess={() => handleNavigate('dashboard')} showMessage={showMessageBox} />;
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'browse':
        return <BrowseItemsPage onNavigate={handleNavigate} showMessage={showMessageBox} />;
      case 'itemDetail':
        return <ItemDetailPage itemId={selectedItemId} currentUserId={userId} onNavigate={handleNavigate} showMessage={showMessageBox} />;
      case 'addItem':
        return <AddItemPage currentUserId={userId} onNavigate={handleNavigate} showMessage={showMessageBox} />;
      case 'dashboard':
        return <UserDashboardPage currentUserId={userId} onNavigate={handleNavigate} showMessage={showMessageBox} />;
      case 'admin':
        // Basic check: only show admin if userId is present and contains 'admin' (for demo purposes)
        // In a real app, this would be role-based access control from Firestore.
        if (userId && userId.includes('admin')) {
          return <AdminPanelPage showMessage={showMessageBox} />;
        } else {
          return <p className="text-center text-red-600 text-xl mt-20">Access Denied: You do not have admin privileges.</p>;
        }
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="font-inter antialiased">
      <Header onNavigate={handleNavigate} userId={userId} onLogout={handleLogout} />
      <main className="pt-4 pb-8"> {/* Added padding to main content */}
        {renderPage()}
      </main>
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={messageBox.onClose}
          onConfirm={messageBox.onConfirm}
        />
      )}
    </div>
  );
}
