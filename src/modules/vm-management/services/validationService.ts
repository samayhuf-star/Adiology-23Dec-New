// Validation Service - Handle form validation and business rules

import { VMConfiguration, ValidationError, VMFormData } from '../types';

class ValidationService {
  /**
   * Validate VM name
   */
  validateVMName(name: string): ValidationError | null {
    if (!name || name.trim().length === 0) {
      return { field: 'name', message: 'VM name is required' };
    }

    if (name.trim().length < 3) {
      return { field: 'name', message: 'VM name must be at least 3 characters long' };
    }

    if (name.trim().length > 50) {
      return { field: 'name', message: 'VM name must be less than 50 characters' };
    }

    // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNameRegex.test(name.trim())) {
      return { field: 'name', message: 'VM name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }

    return null;
  }

  /**
   * Validate operating system selection
   */
  validateOperatingSystem(osType: string, osVersion: string): ValidationError | null {
    if (!osType) {
      return { field: 'osType', message: 'Operating system type is required' };
    }

    if (!['windows', 'linux'].includes(osType)) {
      return { field: 'osType', message: 'Invalid operating system type' };
    }

    if (!osVersion || osVersion.trim().length === 0) {
      return { field: 'osVersion', message: 'Operating system version is required' };
    }

    return null;
  }

  /**
   * Validate region selection
   */
  validateRegion(country: string, regionCode: string): ValidationError | null {
    if (!country || country.trim().length === 0) {
      return { field: 'country', message: 'Country selection is required' };
    }

    if (!regionCode || regionCode.trim().length === 0) {
      return { field: 'regionCode', message: 'Region selection is required' };
    }

    return null;
  }

  /**
   * Validate VM size selection
   */
  validateVMSize(sizeId: string): ValidationError | null {
    if (!sizeId || sizeId.trim().length === 0) {
      return { field: 'sizeId', message: 'VM size selection is required' };
    }

    return null;
  }

  /**
   * Validate complete VM form data
   */
  validateVMForm(formData: VMFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate name
    const nameError = this.validateVMName(formData.name);
    if (nameError) errors.push(nameError);

    // Validate operating system
    const osError = this.validateOperatingSystem(formData.osType, formData.osVersion);
    if (osError) errors.push(osError);

    // Validate region
    const regionError = this.validateRegion(formData.country, formData.regionCode);
    if (regionError) errors.push(regionError);

    // Validate size
    const sizeError = this.validateVMSize(formData.sizeId);
    if (sizeError) errors.push(sizeError);

    return errors;
  }

  /**
   * Validate VM configuration object
   */
  validateVMConfiguration(config: VMConfiguration): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate name
    const nameError = this.validateVMName(config.name);
    if (nameError) errors.push(nameError);

    // Validate OS
    const osError = this.validateOperatingSystem(
      config.operatingSystem.type,
      config.operatingSystem.version
    );
    if (osError) errors.push(osError);

    // Validate region
    const regionError = this.validateRegion(
      config.region.country,
      config.region.code
    );
    if (regionError) errors.push(regionError);

    // Validate size configuration
    if (!config.size.cpu || config.size.cpu <= 0) {
      errors.push({ field: 'size.cpu', message: 'CPU count must be greater than 0' });
    }

    if (!config.size.ram || config.size.ram <= 0) {
      errors.push({ field: 'size.ram', message: 'RAM amount must be greater than 0' });
    }

    if (!config.size.storage || config.size.storage <= 0) {
      errors.push({ field: 'size.storage', message: 'Storage amount must be greater than 0' });
    }

    return errors;
  }

  /**
   * Check if form data is complete
   */
  isFormComplete(formData: VMFormData): boolean {
    return !!(
      formData.name?.trim() &&
      formData.osType &&
      formData.osVersion?.trim() &&
      formData.country?.trim() &&
      formData.regionCode?.trim() &&
      formData.sizeId?.trim()
    );
  }

  /**
   * Validate prepaid balance sufficiency
   */
  validateBalance(currentBalance: number, requiredAmount: number): ValidationError | null {
    if (currentBalance < requiredAmount) {
      const shortfall = requiredAmount - currentBalance;
      return {
        field: 'balance',
        message: `Insufficient balance. You need $${shortfall.toFixed(2)} more to create this VM.`
      };
    }

    return null;
  }

  /**
   * Sanitize VM name for safe usage
   */
  sanitizeVMName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .substring(0, 50); // Limit length
  }

  /**
   * Format validation errors for display
   */
  formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0].message;
    }

    return errors.map(error => `• ${error.message}`).join('\n');
  }

  /**
   * Get field-specific error message
   */
  getFieldError(errors: ValidationError[], fieldName: string): string | null {
    const error = errors.find(e => e.field === fieldName);
    return error ? error.message : null;
  }
}

export const validationService = new ValidationService();