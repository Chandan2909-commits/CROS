import React, { useState } from 'react';

// Actual product image fallbacks for categories
export const CATEGORY_FALLBACK_IMAGES = {
  Beverages: "/products/coke.jpg",
  Snacks: "/products/lays.jpg",
  Dairy: "/products/amul_milk.jpg",
  Bakery: "/products/britannia_bread.jpg",
  Groceries: "/products/maggi.jpg",
  "Personal Care": "/products/dove_soap.jpg",
  Electronics: "/products/boat_cable.jpg",
  Default: "/products/coke.jpg"
};

/**
 * Returns a high-res actual product image URL
 */
export function getProductImageUrl(product) {
  if (product?.image && product.image.trim() !== '') {
    return product.image;
  }
  return CATEGORY_FALLBACK_IMAGES[product?.category] || CATEGORY_FALLBACK_IMAGES.Default;
}

/**
 * Robust Product Image component with automatic actual product fallback
 */
export function ProductImage({ src, alt, category, className = "w-full h-full object-cover" }) {
  const fallback = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.Default;
  const initialSource = src && src.trim() !== '' ? src : fallback;
  const [imgSrc, setImgSrc] = useState(initialSource);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    const validSrc = src && src.trim() !== '' ? src : fallback;
    setImgSrc(validSrc);
    setHasError(false);
  }, [src, fallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || "Product image"}
      onError={handleError}
      loading="lazy"
      className={`${className} transition-opacity duration-300`}
    />
  );
}
