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

  // For non-WIP products with new vendor, require manual input
  if (workInProgress !== 'WIP' && isNewVendor && vendor) {
    console.log('New vendor for non-WIP product, manual input required')
    return {
      code: '',
      success: false,
      message: 'Manual input required for new vendor'
    }
  }

  const isWIP = workInProgress === 'WIP'
  console.log('Is WIP Product?', isWIP, '(work_in_progress value:', workInProgress, ')')

  if (isWIP) {
    return generateWIPCode(country, existingProducts)
  } else {
    return generateNormalCode(country, vendor, existingProducts)
  }
}

/**
 * Generate WIP product code
 * WIP products: Country + WIP, starting from 500
 */
const generateWIPCode = (country, existingProducts) => {
  console.log('=== WIP PRODUCT LOGIC ===')
  
  // For WIP products, ONLY use country + WIP (completely ignore vendor)
  const matchingWIPProducts = existingProducts.filter(p => 
    p.country === country && 
    p.work_in_progress === 'WIP'
  )

  console.log('WIP Search - Country:', country)
  console.log('WIP Products found:', matchingWIPProducts.length)
  console.log('WIP Products:', matchingWIPProducts.map(p => ({ 
    code: p.system_code, 
    vendor: p.vendor,
    wip: p.work_in_progress 
  })))

  if (matchingWIPProducts.length === 0) {
    // First WIP product for this country - start from 500
    const prefix = `${country}-WIP-`
    const newCode = `${prefix}500`
    console.log('Generated first WIP code:', newCode)
    return {
      code: newCode,
      success: true,
      message: 'First WIP product for this country'
    }
  } else {
    // Find the highest WIP system_code number for this country
    const wipCodes = matchingWIPProducts
      .map(p => p.system_code)
      .filter(code => code && /\d+$/.test(code))
      .map(code => {
        const match = code.match(/(\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => !isNaN(num) && num >= 500) // Only consider codes 500 and above

    console.log('WIP Codes found:', wipCodes)

    if (wipCodes.length > 0) {
      const maxCode = Math.max(...wipCodes)
      const newCode = maxCode + 1
      console.log('Max WIP code:', maxCode, 'New code:', newCode)
      
      // Maintain the same prefix pattern
      const lastWIPProduct = matchingWIPProducts
        .filter(p => p.system_code && /\d+$/.test(p.system_code))
        .map(p => {
          const num = parseInt(p.system_code.match(/(\d+)$/)[1])
          return { ...p, numCode: num }
        })
        .filter(p => p.numCode >= 500)
        .sort((a, b) => b.numCode - a.numCode)[0]

      if (lastWIPProduct) {
        const prefix = lastWIPProduct.system_code.replace(/\d+$/, '')
        const finalCode = `${prefix}${newCode}`
        console.log('Generated WIP code with existing prefix:', finalCode)
        return {
          code: finalCode,
          success: true,
          message: 'Generated based on existing WIP pattern'
        }
      } else {
        // Fallback to default prefix
        const prefix = `${country}-WIP-`
        const finalCode = `${prefix}500`
        console.log('Generated WIP code with default prefix:', finalCode)
        return {
          code: finalCode,
          success: true,
          message: 'Generated with default WIP prefix'
        }
      }
    } else {
      // No existing WIP codes >= 500, start from 500
      const prefix = `${country}-WIP-`
      const finalCode = `${prefix}500`
      console.log('No valid WIP codes found, starting from 500:', finalCode)
      return {
        code: finalCode,
        success: true,
        message: 'Starting WIP sequence from 500'
      }
    }
  }
}

/**
 * Generate normal (non-WIP) product code
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
    return 'Auto-generated for WIP products (Country + WIP, starts from 500)'
  } else {
    return 'Auto-generated for regular products (Country + Vendor, 001-499)'
  }
}
