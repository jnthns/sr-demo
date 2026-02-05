'use client'

import { useState, useEffect } from "react";
import { logEvent } from "../../lib/amplitude"

export default function StorePage() {
  // Mock product data
  const [products] = useState([
    {
      id: 1,
      name: "Wireless Headphones",
      price: 99.99,
      category: "Electronics",
      description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
      image: "🎧"
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 249.99,
      category: "Electronics",
      description: "Advanced smartwatch with health monitoring, GPS, and water resistance.",
      image: "⌚"
    },
    {
      id: 3,
      name: "Coffee Maker",
      price: 79.99,
      category: "Home",
      description: "Programmable coffee maker with built-in grinder and thermal carafe.",
      image: "☕"
    },
    {
      id: 4,
      name: "Yoga Mat",
      price: 29.99,
      category: "Fitness",
      description: "Premium non-slip yoga mat with carrying strap and alignment lines.",
      image: "🧘"
    },
    {
      id: 5,
      name: "Bluetooth Speaker",
      price: 59.99,
      category: "Electronics",
      description: "Portable Bluetooth speaker with 360-degree sound and waterproof design.",
      image: "🔊"
    },
    {
      id: 6,
      name: "Desk Lamp",
      price: 45.99,
      category: "Home",
      description: "LED desk lamp with adjustable brightness and USB charging port.",
      image: "💡"
    },
    {
      id: 7,
      name: "Water Bottle",
      price: 19.99,
      category: "Fitness",
      description: "Insulated stainless steel water bottle that keeps drinks cold for 24 hours.",
      image: "🍶"
    },
    {
      id: 8,
      name: "Phone Case",
      price: 24.99,
      category: "Electronics",
      description: "Protective phone case with shock absorption and wireless charging compatibility.",
      image: "📱"
    }
  ]);

  // State management
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [checkoutData, setCheckoutData] = useState({});
  const [showCart, setShowCart] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ecommerce-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ecommerce-cart', JSON.stringify(cart));
  }, [cart]);

  // Track product list viewed on mount
  useEffect(() => {
    logEvent('Product List Viewed', {
      category: 'all',
      product_ids: products.map(p => p.id)
    });
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cart functions
  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }
    
    setCart(newCart);
    
    logEvent('Product Added', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: quantity,
      cart_total: newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  };

  const removeFromCart = (productId) => {
    const product = cart.find(item => item.id === productId);
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    
    if (product) {
      logEvent('Product Removed', {
        product_id: product.id,
        product_name: product.name
      });
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
  };

  // Search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    logEvent('Products Searched', {
      query: query,
      results_count: filteredProducts.length
    });
  };

  // Product detail functions
  const viewProduct = (product) => {
    setSelectedProduct(product);
    logEvent('Product Clicked', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      position: products.indexOf(product) + 1
    });
    
    // Track product viewed when modal opens
    logEvent('Product Viewed', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      category: product.category
    });
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
  };

  // Checkout functions
  const startCheckout = () => {
    setCheckoutStep(1);
    setShowCart(false);
    logEvent('Checkout Started', {
      cart_value: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      item_count: cart.reduce((sum, item) => sum + item.quantity, 0),
      product_ids: cart.map(item => item.id)
    });
  };

  const nextCheckoutStep = () => {
    setCheckoutStep(prev => prev + 1);
    logEvent('Checkout Step Completed', {
      step: checkoutStep,
      step_name: getCheckoutStepName(checkoutStep)
    });
  };

  const prevCheckoutStep = () => {
    setCheckoutStep(prev => prev - 1);
  };

  const completePurchase = () => {
    const orderId = `ORDER_${Date.now()}`;
    const totalRevenue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Track unverified revenue according to Amplitude documentation
    // For web purchases, including $revenue property creates both "Revenue" and "Revenue (Unverified)" events
    // See: https://amplitude.com/docs/data/sources/instrument-track-revenue
    // Track revenue for each product line item (recommended for detailed analysis)
    cart.forEach(item => {
      const itemRevenue = item.price * item.quantity;
      
      logEvent('Purchase Completed', {
        // Revenue properties (with $ prefix) as per Amplitude documentation
        $revenue: itemRevenue,           // Total revenue for this line item (required for Revenue LTV chart)
        $price: item.price,              // Price per unit
        $quantity: item.quantity,         // Quantity purchased
        $productId: item.id.toString(),  // Product identifier
        $currency: 'USD',                 // ISO 4217 currency code
        $revenueType: 'purchase',        // Type of revenue
        // Additional event properties for segmentation
        order_id: orderId,
        product_name: item.name,
        product_category: item.category
      });
    });

    // Track Purchase Completed event with order-level summary
    // Include $revenue for the total order to ensure it appears in Revenue LTV charts
    logEvent('Purchase Completed', {
      // Revenue properties for the total order
      $revenue: totalRevenue,        // Total revenue for the entire order (required for Revenue LTV chart)
      $currency: 'USD',               // ISO 4217 currency code
      $revenueType: 'purchase',       // Type of revenue
      // Additional event properties
      order_id: orderId,
      revenue: totalRevenue,          // Keep for backward compatibility
      item_count: totalQuantity,
      products: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });

    // Clear cart and reset
    setCart([]);
    setCheckoutStep(0);
    setCheckoutData({});
    alert(`Order ${orderId} completed! Total: $${totalRevenue.toFixed(2)}`);
  };

  const getCheckoutStepName = (step) => {
    const steps = ['', 'Customer Info', 'Shipping', 'Payment', 'Review'];
    return steps[step] || 'Unknown';
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Track checkout step viewed
  useEffect(() => {
    if (checkoutStep > 0) {
      logEvent('Checkout Step Viewed', {
        step: checkoutStep,
        step_name: getCheckoutStepName(checkoutStep)
      });
    }
  }, [checkoutStep]);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <p className="amp-unmask fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            This is unmasked.
          </p>
        </div>
        <br />

        <div className="w-full max-w-6xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
          <h2 className="text-2xl font-semibold mb-6">E-commerce Store</h2>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            />
          </div>

          {/* Cart Button */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setShowCart(!showCart)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center space-x-2"
            >
              <span>🛒</span>
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {cartItemCount}
              </span>
            </button>
          </div>

          {/* Cart Sidebar */}
          {showCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCart(false)}>
              <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-zinc-800 shadow-xl p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Shopping Cart</h3>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-zinc-600 rounded">
                          <span className="text-2xl">{item.image}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">${item.price}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 bg-gray-200 dark:bg-zinc-600 rounded text-xs"
                              >
                                -
                              </button>
                              <span className="text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 bg-gray-200 dark:bg-zinc-600 rounded text-xs"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 text-xs ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-zinc-600 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total: ${cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={startCheckout}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                      >
                        Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="border border-gray-200 dark:border-zinc-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="text-4xl text-center mb-3">{product.image}</div>
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{product.category}</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3">${product.price}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewProduct(product)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 py-2 px-3 rounded text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Product Detail Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-semibold">{selectedProduct.name}</h3>
                  <button
                    onClick={closeProductDetail}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-6xl text-center mb-4">{selectedProduct.image}</div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{selectedProduct.category}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">${selectedProduct.price}</p>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{selectedProduct.description}</p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      closeProductDetail();
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={closeProductDetail}
                    className="px-6 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Flow */}
          {checkoutStep > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
                <h3 className="text-xl font-semibold mb-4">Checkout - {getCheckoutStepName(checkoutStep)}</h3>
                
                {checkoutStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                        value={checkoutData.name || ''}
                        onChange={(e) => setCheckoutData({...checkoutData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                        value={checkoutData.email || ''}
                        onChange={(e) => setCheckoutData({...checkoutData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                        value={checkoutData.phone || ''}
                        onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                {checkoutStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                        value={checkoutData.address || ''}
                        onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                          value={checkoutData.city || ''}
                          onChange={(e) => setCheckoutData({...checkoutData, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ZIP Code</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                          value={checkoutData.zip || ''}
                          onChange={(e) => setCheckoutData({...checkoutData, zip: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {checkoutStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                        value={checkoutData.cardNumber || ''}
                        onChange={(e) => setCheckoutData({...checkoutData, cardNumber: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                          value={checkoutData.expiry || ''}
                          onChange={(e) => setCheckoutData({...checkoutData, expiry: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded dark:bg-zinc-700 dark:text-white"
                          value={checkoutData.cvv || ''}
                          onChange={(e) => setCheckoutData({...checkoutData, cvv: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {checkoutStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Order Summary</h4>
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-zinc-600 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  {checkoutStep > 1 && (
                    <button
                      onClick={prevCheckoutStep}
                      className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                      Previous
                    </button>
                  )}
                  
                  {checkoutStep < 4 ? (
                    <button
                      onClick={nextCheckoutStep}
                      className="ml-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={completePurchase}
                      className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Complete Purchase
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
