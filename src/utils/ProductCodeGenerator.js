/**
 * Product Code Generator Utility
 * Handles automatic generation of product codes based on country, vendor, and WIP status
 */

/**
 * Generate product code based on business rules
 * @param {Object} params - Generation parameters
 * @param {string} params.country - Product country
 * @param {string} params.vendor - Product vendor
 * @param {string} params.workInProgress - WIP status ('WIP' or empty)
 * @param {Array} params.existingProducts - Array of existing products
 * @param {boolean} params.isNewCountry - Whether this is a new country
 * @param {boolean} params.isNewVendor - Whether this is a new vendor
 * @returns {Object} - { code: string, success: boolean, message: string }
 */
export const generateProductCode = ({
  country,
  vendor,
  workInProgress,
  existingProducts,
  isNewCountry,
  isNewVendor
}) => {
  console.log('=== Generate Product Code Called ===')
  console.log('Parameters:', {
    country,
    vendor,
    workInProgress,
    isNewCountry,
    isNewVendor,
    existingProductsCount: existingProducts.length
  })

  // Validation
  if (!country) {
    return {
      code: '',
      success: false,
      message: 'Country is required for code generation'
    }
  }

  // If new country, require manual input
  if (isNewCountry) {
    console.log('New country detected, manual input required')
    return {
      code: '',
      success: false,
      message: 'Manual input required for new country'
    }
  }

  const isWIP = workInProgress === 'WIP'
  console.log('Is WIP Product?', isWIP, '(work_in_progress value:', workInProgress, ')')

  // WIP products logic - applies to ANY country
  if (isWIP) {
    return generateWIPCodeByCountry(country, existingProducts)
  }

  // Singapore special logic
  if (country === 'Singapore') {
    const SINGAPORE_SPECIAL_VENDORS = ['Canning Vale', 'Halifa']
    if (!SINGAPORE_SPECIAL_VENDORS.includes(vendor)) {
      console.log('Singapore non-special vendor detected, using general Singapore logic')
      return generateSingaporeGeneralCode(country, vendor, existingProducts)
    }
  }

  // For Singapore special vendors or other countries, use original logic
  if (isNewVendor && vendor) {
    console.log('New vendor for non-WIP product, manual input required')
    return {
      code: '',
      success: false,
      message: 'Manual input required for new vendor'
    }
  }

  return generateNormalCode(country, vendor, existingProducts)
}

/**
 * Generate code for Singapore non-special vendors
 * Logic: Find highest numbered Singapore product (excluding WIP), keep its prefix, increment number
 */
const generateSingaporeGeneralCode = (country, vendor, existingProducts) => {
  console.log('=== SINGAPORE GENERAL CODE LOGIC ===')
  
  // Find all Singapore non-WIP products
  const singaporeProducts = existingProducts.filter(p => 
    p.country === 'Singapore' && 
    (!p.work_in_progress || p.work_in_progress !== 'WIP')
  )

  console.log('Singapore non-WIP products found:', singaporeProducts.length)
  console.log('Singapore products:', singaporeProducts.map(p => ({ 
    code: p.system_code, 
    vendor: p.vendor,
    wip: p.work_in_progress 
  })))

  if (singaporeProducts.length === 0) {
    console.log('No Singapore products found, manual input required')
    return {
      code: '',
      success: false,
      message: 'Manual input required - no existing Singapore products found'
    }
  }

  // Find the product with the highest number
  let maxProduct = null
  let maxNumber = -1

  singaporeProducts.forEach(product => {
    const match = product.system_code.match(/(\d+)$/)
    if (match) {
      const number = parseInt(match[1])
      console.log(`Product ${product.system_code} has number: ${number}`)
      if (number > maxNumber) {
        maxNumber = number
        maxProduct = product
      }
    }
  })

  if (maxProduct && maxNumber >= 0) {
    // Keep the prefix of the highest numbered product, increment the number
    const prefix = maxProduct.system_code.replace(/\d+$/, '')
    const newNumber = maxNumber + 1
    const paddedNumber = newNumber.toString().padStart(3, '0')
    const newCode = `${prefix}${paddedNumber}`
    
    console.log(`Highest Singapore product: ${maxProduct.system_code} (${maxNumber})`)
    console.log(`Generated new code: ${newCode}`)
    
    return {
      code: newCode,
      success: true,
      message: `Generated based on highest Singapore code: ${maxProduct.system_code}`
    }
  }

  console.log('No valid Singapore codes found')
  return {
    code: '',
    success: false,
    message: 'No valid Singapore product codes found'
  }
}

/**
 * Generate WIP code for any country
 * Logic: Find highest numbered WIP product for this country, keep its prefix, increment number
 */
const generateWIPCodeByCountry = (country, existingProducts) => {
  console.log('=== WIP PRODUCT LOGIC FOR COUNTRY ===')
  console.log('Country:', country)
  
  // Find all WIP products for this country
  const countryWIPProducts = existingProducts.filter(p => 
    p.country === country && 
    p.work_in_progress === 'WIP'
  )

  console.log('WIP products found for', country + ':', countryWIPProducts.length)
  console.log('WIP Products:', countryWIPProducts.map(p => ({ 
    code: p.system_code, 
    vendor: p.vendor,
    wip: p.work_in_progress 
  })))

  if (countryWIPProducts.length === 0) {
    console.log('No WIP products found for', country + ', manual input required')
    return {
      code: '',
      success: false,
      message: `Manual input required - no existing WIP products found for ${country}`
    }
  }

  // Find the WIP product with the highest number
  let maxWIPProduct = null
  let maxWIPNumber = -1

  countryWIPProducts.forEach(product => {
    const match = product.system_code.match(/(\d+)$/)
    if (match) {
      const number = parseInt(match[1])
      console.log(`WIP Product ${product.system_code} has number: ${number}`)
      if (number > maxWIPNumber) {
        maxWIPNumber = number
        maxWIPProduct = product
      }
    }
  })

  if (maxWIPProduct && maxWIPNumber >= 0) {
    // Keep the prefix of the highest numbered WIP product, increment the number
    const prefix = maxWIPProduct.system_code.replace(/\d+$/, '')
    const newNumber = maxWIPNumber + 1
    const newCode = `${prefix}${newNumber}`
    
    console.log(`Highest WIP product for ${country}: ${maxWIPProduct.system_code} (${maxWIPNumber})`)
    console.log(`Generated new WIP code: ${newCode}`)
    
    return {
      code: newCode,
      success: true,
      message: `Generated based on highest WIP code: ${maxWIPProduct.system_code}`
    }
  }

  console.log('No valid WIP codes found for', country)
  return {
    code: '',
    success: false,
    message: `No valid WIP product codes found for ${country}`
  }
}

/**
 * Generate normal (non-WIP) product code - Original logic for other cases
 * Normal products: Country + Vendor, codes 001-499
 */
const generateNormalCode = (country, vendor, existingProducts) => {
  console.log('=== NORMAL PRODUCT LOGIC ===')
  
  // For non-WIP products, use country+vendor and exclude WIP products
  const matchingNonWIPProducts = existingProducts.filter(p => 
    p.country === country && 
    (vendor ? p.vendor === vendor : !p.vendor) &&
    (!p.work_in_progress || p.work_in_progress !== 'WIP')
  )

  console.log('Normal Product Search - Country:', country, 'Vendor:', vendor)
  console.log('Normal Products found:', matchingNonWIPProducts.length)
  console.log('Normal Products:', matchingNonWIPProducts.map(p => ({ 
    code: p.system_code, 
    vendor: p.vendor,
    wip: p.work_in_progress 
  })))

  if (matchingNonWIPProducts.length === 0) {
    // First non-WIP product for this country/vendor combination
    console.log('No existing normal products found, manual input required')
    return {
      code: '',
      success: false,
      message: 'Manual input required for first product in this category'
    }
  } else {
    // Find the highest non-WIP system_code number (excluding 500+ range)
    const nonWIPCodes = matchingNonWIPProducts
      .map(p => p.system_code)
      .filter(code => code && /\d+$/.test(code))
      .map(code => {
        const match = code.match(/(\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => !isNaN(num) && num < 500) // Only consider codes below 500

    console.log('Normal Codes found:', nonWIPCodes)

    if (nonWIPCodes.length > 0) {
      const maxCode = Math.max(...nonWIPCodes)
      const newCode = maxCode + 1
      console.log('Max normal code:', maxCode, 'New code:', newCode)
      
      // Don't let non-WIP codes reach 500 range
      if (newCode >= 500) {
        return {
          code: '',
          success: false,
          message: 'Warning: Non-WIP product codes are approaching WIP range (500+). Please assign manually.'
        }
      }
      
      // Maintain the same prefix pattern and ensure 3-digit format
      const lastNonWIPProduct = matchingNonWIPProducts
        .filter(p => p.system_code && /\d+$/.test(p.system_code))
        .map(p => {
          const num = parseInt(p.system_code.match(/(\d+)$/)[1])
          return { ...p, numCode: num }
        })
        .filter(p => p.numCode < 500)
        .sort((a, b) => b.numCode - a.numCode)[0]

      if (lastNonWIPProduct) {
        const prefix = lastNonWIPProduct.system_code.replace(/\d+$/, '')
        // Format number with leading zeros (3 digits) for non-WIP
        const formattedCode = newCode.toString().padStart(3, '0')
        const finalCode = `${prefix}${formattedCode}`
        console.log('Generated normal code with existing prefix:', finalCode)
        return {
          code: finalCode,
          success: true,
          message: 'Generated based on existing pattern'
        }
      } else {
        // Format as 3-digit number
        const formattedCode = newCode.toString().padStart(3, '0')
        console.log('Generated normal code:', formattedCode)
        return {
          code: formattedCode,
          success: true,
          message: 'Generated simple numeric code'
        }
      }
    } else {
      console.log('No valid normal codes found, manual input required')
      return {
        code: '',
        success: false,
        message: 'Manual input required - no valid existing codes found'
      }
    }
  }
}

/**
 * Validate if a product code is available
 * @param {string} code - Code to validate
 * @param {Array} existingProducts - Array of existing products
 * @param {string} excludeCode - Code to exclude from check (for editing)
 * @returns {Object} - { isAvailable: boolean, message: string }
 */
export const validateProductCode = (code, existingProducts, excludeCode = null) => {
  if (!code || !code.trim()) {
    return {
      isAvailable: false,
      message: 'Product code is required'
    }
  }

  const trimmedCode = code.trim()
  const existingProduct = existingProducts.find(p => 
    p.system_code === trimmedCode && p.system_code !== excludeCode
  )

  if (existingProduct) {
    return {
      isAvailable: false,
      message: 'Product code already exists'
    }
  }

  return {
    isAvailable: true,
    message: 'Product code is available'
  }
}

/**
 * Get code generation info for UI display
 * @param {Object} params - Same as generateProductCode
 * @returns {string} - Information message for user
 */
export const getCodeGenerationInfo = ({
  country,
  vendor,
  workInProgress,
  isNewCountry,
  isNewVendor
}) => {
  if (isNewCountry || isNewVendor) {
    return 'Enter item code manually'
  }

  if (!country) {
    return 'Will be generated automatically'
  }

  if (workInProgress === 'WIP') {
    return `Auto-generated for WIP products (Based on highest ${country} WIP code)`
  }

  if (country === 'Singapore') {
    const SINGAPORE_SPECIAL_VENDORS = ['Canning Vale', 'Halifa']
    if (!SINGAPORE_SPECIAL_VENDORS.includes(vendor)) {
      return 'Auto-generated for Singapore (Based on highest Singapore code)'
    }
  }

  return 'Auto-generated for regular products (Country + Vendor, 001-499)'
}
