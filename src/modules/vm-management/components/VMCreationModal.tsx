// VM Creation Modal - Form for creating new virtual machines

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { VM, VMConfiguration, Region, VMSize, VMFormData, PriceInfo } from '../types';
import { vmService, pricingService, validationService, billingService } from '../services';
import { EnhancedCard } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

interface VMCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vm: VM) => void;
  availableRegions: Region[];
  availableSizes: VMSize[];
  userId: string;
}

export const VMCreationModal: React.FC<VMCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableRegions,
  availableSizes,
  userId,
}) => {
  const [formData, setFormData] = useState<VMFormData>({
    name: '',
    osType: 'windows',
    osVersion: '',
    country: '',
    regionCode: '',
    sizeId: '',
  });

  const [pricing, setPricing] = useState<PriceInfo | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const operatingSystems = {
    windows: ['Windows Server 2022', 'Windows Server 2019', 'Windows 11', 'Windows 10'],
    linux: ['Ubuntu 22.04 LTS', 'Ubuntu 20.04 LTS', 'CentOS 8', 'Debian 11', 'Red Hat Enterprise Linux 8'],
  };

  // Load user balance on mount
  useEffect(() => {
    if (isOpen) {
      loadUserBalance();
    }
  }, [isOpen, userId]);

  // Update pricing when configuration changes
  useEffect(() => {
    if (isFormComplete()) {
      updatePricing();
    } else {
      setPricing(null);
    }
  }, [formData]);

  const loadUserBalance = async () => {
    try {
      setBalanceLoading(true);
      const balanceInfo = await billingService.getCurrentBalance(userId);
      setCurrentBalance(balanceInfo.currentBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
      setCurrentBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const isFormComplete = () => {
    return validationService.isFormComplete(formData);
  };

  const updatePricing = async () => {
    if (!isFormComplete()) return;

    try {
      setPricingLoading(true);
      
      const selectedSize = availableSizes.find(size => 
        `${size.cpu}-${size.ram}-${size.storage}` === formData.sizeId
      );
      
      if (!selectedSize) return;

      const config: VMConfiguration = {
        name: formData.name,
        operatingSystem: {
          type: formData.osType,
          version: formData.osVersion,
        },
        region: {
          country: formData.country,
          code: formData.regionCode,
        },
        size: selectedSize,
      };

      const priceInfo = await pricingService.getPricingWithCache(config);
      setPricing(priceInfo);
    } catch (error) {
      console.error('Error updating pricing:', error);
      setPricing(null);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleInputChange = (field: keyof VMFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear OS version when OS type changes
    if (field === 'osType') {
      setFormData(prev => ({ ...prev, osVersion: '' }));
    }
    
    // Clear region code when country changes
    if (field === 'country') {
      setFormData(prev => ({ ...prev, regionCode: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete() || !pricing) {
      return;
    }

    try {
      setCreating(true);
      setErrors([]);

      // Validate form
      const validationErrors = validationService.validateVMForm(formData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors.map(e => e.message));
        return;
      }

      // Validate balance
      const balanceValidation = await billingService.validatePayment(userId, pricing);
      if (!balanceValidation.valid) {
        setErrors([balanceValidation.error || 'Payment validation failed']);
        return;
      }

      // Create VM configuration
      const selectedSize = availableSizes.find(size => 
        `${size.cpu}-${size.ram}-${size.storage}` === formData.sizeId
      );

      if (!selectedSize) {
        setErrors(['Invalid VM size selection']);
        return;
      }

      const config: VMConfiguration = {
        name: validationService.sanitizeVMName(formData.name),
        operatingSystem: {
          type: formData.osType,
          version: formData.osVersion,
        },
        region: {
          country: formData.country,
          code: formData.regionCode,
        },
        size: selectedSize,
      };

      // Create VM
      const newVM = await vmService.createVM(config);
      
      // Success
      onSubmit(newVM);
      resetForm();
    } catch (error) {
      console.error('Error creating VM:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to create VM']);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      osType: 'windows',
      osVersion: '',
      country: '',
      regionCode: '',
      sizeId: '',
    });
    setPricing(null);
    setErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRegionsForCountry = (country: string) => {
    return availableRegions.filter(region => region.country === country);
  };

  const uniqueCountries = Array.from(
    new Set(availableRegions.map(region => region.country))
  ).sort();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const canAffordVM = pricing && currentBalance >= pricing.monthlyRate;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <EnhancedCard className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Create Virtual Machine
          </h2>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </EnhancedButton>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50/50 backdrop-blur-sm border border-red-200/50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Balance Display */}
          <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-200/50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Current Balance: {balanceLoading ? 'Loading...' : formatPrice(currentBalance)}
              </span>
            </div>
          </div>

          {/* VM Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VM Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter a name for your VM"
              className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              required
            />
          </div>

          {/* Operating System */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating System *
              </label>
              <select
                value={formData.osType}
                onChange={(e) => handleInputChange('osType', e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                required
              >
                <option value="windows">Windows</option>
                <option value="linux">Linux</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version *
              </label>
              <select
                value={formData.osVersion}
                onChange={(e) => handleInputChange('osVersion', e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                required
                disabled={!formData.osType}
              >
                <option value="">Select version</option>
                {operatingSystems[formData.osType]?.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                required
              >
                <option value="">Select country</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region *
              </label>
              <select
                value={formData.regionCode}
                onChange={(e) => handleInputChange('regionCode', e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                required
                disabled={!formData.country}
              >
                <option value="">Select region</option>
                {getRegionsForCountry(formData.country).map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VM Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VM Size *
            </label>
            <select
              value={formData.sizeId}
              onChange={(e) => handleInputChange('sizeId', e.target.value)}
              className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              required
            >
              <option value="">Select VM size</option>
              {availableSizes.map((size) => (
                <option
                  key={`${size.cpu}-${size.ram}-${size.storage}`}
                  value={`${size.cpu}-${size.ram}-${size.storage}`}
                >
                  {size.displayName} - {size.cpu} CPU, {size.ram}GB RAM, {size.storage}GB Storage
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Display */}
          {isFormComplete() && (
            <div className="bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Pricing</h3>
              {pricingLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Calculating price...</span>
                </div>
              ) : pricing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider Rate:</span>
                    <span>{formatPrice(pricing.providerRate)}/hour</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Our Rate (20% markup):</span>
                    <span>{formatPrice(pricing.hourlyRate)}/hour</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Monthly Total:</span>
                    <span className={canAffordVM ? 'text-green-600' : 'text-red-600'}>
                      {formatPrice(pricing.monthlyRate)}
                    </span>
                  </div>
                  {!canAffordVM && (
                    <div className="text-sm text-red-600 mt-2">
                      Insufficient balance. You need {formatPrice(pricing.monthlyRate - currentBalance)} more.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">Unable to calculate pricing</div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <EnhancedButton
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              type="submit"
              disabled={!isFormComplete() || !pricing || !canAffordVM || creating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {creating ? 'Creating...' : `Create VM - ${pricing ? formatPrice(pricing.monthlyRate) : ''}`}
            </EnhancedButton>
          </div>
        </form>
      </EnhancedCard>
    </div>
  );
};