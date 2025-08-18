/**
 * Product Code Generator Utility
 * Handles automatic generation of product codes based on country, vendor, and WIP status
 */

/**
 * Main function to generate product code based on business rules
 */
export const generateProductCode = ({
  country,
  vendor,
  workInProgress,
  existingProducts,
  isNewCountry,
  isNewVendor
}) => {
  console.log('=== Generate Product Code Called ===');
  console.log('Parameters:', { country, vendor, workInProgress, isNewCountry, isNewVendor });

  if (!country) {
    return { code: '', success: false, message: 'Country is required' };
  }
  if (isNewCountry) {
    return { code: '', success: false, message: 'Manual input required for new country' };
  }
  if (workInProgress !== 'WIP' && isNewVendor && vendor) {
    return { code: '', success: false, message: 'Manual input required for new vendor' };
  }

  const isWIP = workInProgress === 'WIP';
  console.log('Is WIP Product?', isWIP);

  if (isWIP) {
    return generateWIPCode(country, existingProducts);
  } else {
    return generateNormalCode(country, vendor, existingProducts);
  }
};

/**
 * Generate WIP product code (Country-WIP-Number, starting from 500)
 */
const generateWIPCode = (country, existingProducts) => {
  console.log('=== WIP PRODUCT LOGIC ===');
  const prefix = `${country}-WIP-`;
  
  const wipProducts = existingProducts.filter(p => p.system_code?.startsWith(prefix));

  let maxNum = 499; // Start from 500 if no codes exist
  wipProducts.forEach(p => {
    const numPart = parseInt(p.system_code.substring(prefix.length), 10);
    if (!isNaN(numPart) && numPart > maxNum) {
      maxNum = numPart;
    }
  });

  const newNum = maxNum + 1;
  // WIP codes are not padded
  const newCode = `${prefix}${newNum}`;

  console.log(`Generated WIP code: ${newCode}`);
  return { code: newCode, success: true, message: 'Generated WIP Code' };
};

/**
 * Generate normal (non-WIP) product code (Country-Vendor-XXX, 001-499)
 */
const generateNormalCode = (country, vendor, existingProducts) => {
  console.log('=== NORMAL PRODUCT LOGIC ===');
  
  const isSpecialSingaporeRule = country === 'Singapore' && vendor && vendor !== 'Halifa' && vendor !== 'Canning Vale';

  let productsToSearch;
  if (isSpecialSingaporeRule) {
    console.log('Applying Singapore special rule: Searching all non-WIP Singapore products.');
    productsToSearch = existingProducts.filter(p =>
      p.country === 'Singapore' && (!p.work_in_progress || p.work_in_progress !== 'WIP')
    );
  } else {
    console.log(`Applying standard rule for Country: ${country}, Vendor: ${vendor}`);
    productsToSearch = existingProducts.filter(p =>
      p.country === country &&
      p.vendor === vendor &&
      (!p.work_in_progress || p.work_in_progress !== 'WIP')
    );
  }

  console.log(`Found ${productsToSearch.length} products to determine max code.`);

  let maxNum = 0;
  productsToSearch.forEach(p => {
    const code = p.system_code || '';
    const parts = code.split('-');
    if (parts.length >= 3) {
        const numPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(numPart) && numPart < 500 && numPart > maxNum) {
            maxNum = numPart;
        }
    }
  });

  const newNum = maxNum + 1;
  console.log(`Max code found: ${maxNum}. New sequence number: ${newNum}`);

  if (newNum >= 500) {
    return { code: '', success: false, message: 'Error: Sequence has reached the WIP range (500+).' };
  }

  // Use the current vendor for the prefix, not from the searched products
  if (!vendor) {
      return { code: '', success: false, message: 'Vendor is required for non-WIP products.' };
  }

  const prefix = `${country}-${vendor}-`;
  const formattedNum = String(newNum).padStart(3, '0');
  const newCode = `${prefix}${formattedNum}`;

  // Final check for uniqueness, just in case.
  if (existingProducts.some(p => p.system_code === newCode)) {
      return { code: '', success: false, message: `Generated code ${newCode} already exists. Please check manually.` };
  }

  console.log(`Generated normal code: ${newCode}`);
  return { code: newCode, success: true, message: 'Generated Normal Code' };
};

/**
 * Validate if a product code is available
 */
export const validateProductCode = (code, existingProducts, excludeCode = null) => {
  if (!code || !code.trim()) {
    return { isAvailable: false, message: 'Product code is required' };
  }
  const trimmedCode = code.trim();
  const existingProduct = existingProducts.find(p => p.system_code === trimmedCode && p.system_code !== excludeCode);
  if (existingProduct) {
    return { isAvailable: false, message: 'Product code already exists' };
  }
  return { isAvailable: true, message: 'Product code is available' };
};

/**
 * Get code generation info for UI display
 */
export const getCodeGenerationInfo = ({ country, vendor, workInProgress, isNewCountry, isNewVendor }) => {
  if (isNewCountry || (isNewVendor && workInProgress !== 'WIP')) {
    return 'Enter item code manually';
  }
  if (!country) {
    return 'Will be generated automatically';
  }
  if (workInProgress === 'WIP') {
    return 'Auto: Country-WIP-### (>=500)';
  } else {
    return 'Auto: Country-Vendor-### (<500)';
  }
};
