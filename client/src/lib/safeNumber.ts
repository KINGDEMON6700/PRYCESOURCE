/**
 * Utility functions for safe number operations to prevent runtime errors
 */

export function safeToFixed(value: any, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  
  const num = typeof value === 'number' ? value : parseFloat(value.toString());
  
  if (isNaN(num)) {
    return '0.00';
  }
  
  return num.toFixed(decimals);
}

export function safeRating(rating: any): string {
  if (rating === null || rating === undefined || rating === '' || rating === 0) {
    return 'N/A';
  }
  
  const num = typeof rating === 'number' ? rating : parseFloat(rating.toString());
  
  if (isNaN(num) || num <= 0) {
    return 'N/A';
  }
  
  return num.toFixed(1);
}

export function safeDistance(distance: any): string {
  if (distance === null || distance === undefined || distance === '' || distance === 0) {
    return '';
  }
  
  const num = typeof distance === 'number' ? distance : parseFloat(distance.toString());
  
  if (isNaN(num) || num <= 0) {
    return '';
  }
  
  return num.toFixed(1);
}

export function safePrice(price: any): string {
  if (price === null || price === undefined || price === '') {
    return '0.00';
  }
  
  const num = typeof price === 'number' ? price : parseFloat(price.toString());
  
  if (isNaN(num)) {
    return '0.00';
  }
  
  return num.toFixed(2);
}

export function safeNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  const num = typeof value === 'number' ? value : parseFloat(value.toString());
  
  if (isNaN(num)) {
    return 0;
  }
  
  return num;
}