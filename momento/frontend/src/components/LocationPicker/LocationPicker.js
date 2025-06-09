import React, { useState, useEffect } from 'react';
import './LocationPicker.css';

const LocationPicker = ({ onLocationChange, initialLocation = '' }) => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [manualLocation, setManualLocation] = useState(initialLocation);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);
    const [locationPermission, setLocationPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

    // Check geolocation permission status
    useEffect(() => {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setLocationPermission(result.state);
                
                // Listen for permission changes
                result.addEventListener('change', () => {
                    setLocationPermission(result.state);
                });
            });
        }
    }, []);

    // Reverse geocoding function to get address from coordinates
    const reverseGeocode = async (latitude, longitude) => {
        try {
            // Using OpenStreetMap Nominatim API (free, no API key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            
            if (!response.ok) {
                throw new Error('Failed to get address');
            }
            
            const data = await response.json();
            
            if (data && data.address) {
                const address = data.address;
                const formattedLocation = {
                    name: data.display_name,
                    coordinates: { latitude, longitude },
                    address: {
                        street: `${address.house_number || ''} ${address.road || ''}`.trim(),
                        city: address.city || address.town || address.village || '',
                        state: address.state || address.region || '',
                        country: address.country || '',
                        zipCode: address.postcode || ''
                    }
                };
                
                return formattedLocation;
            }
            
            throw new Error('No address found');
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            // Fallback to coordinates only
            return {
                name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                coordinates: { latitude, longitude },
                address: {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    zipCode: ''
                }
            };
        }
    };

    // Get current GPS location
    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
        }

        setIsLoadingLocation(true);
        setLocationError('');

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log('GPS coordinates obtained:', latitude, longitude);
                    
                    // Get readable address from coordinates
                    const locationData = await reverseGeocode(latitude, longitude);
                    
                    setCurrentLocation(locationData);
                    setIsLoadingLocation(false);
                    
                    // If user wants to use current location, update the form
                    if (useCurrentLocation) {
                        onLocationChange(locationData);
                    }
                } catch (error) {
                    console.error('Error processing location:', error);
                    setLocationError('Failed to get address for current location');
                    setIsLoadingLocation(false);
                }
            },
            (error) => {
                setIsLoadingLocation(false);
                let errorMessage = 'Failed to get current location';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        setLocationPermission('denied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while getting location';
                        break;
                }
                
                setLocationError(errorMessage);
                console.error('Geolocation error:', error);
            },
            options
        );
    };

    // Handle manual location input
    const handleManualLocationChange = (e) => {
        const value = e.target.value;
        setManualLocation(value);
        
        // If not using current location, update parent with manual input
        if (!useCurrentLocation) {
            onLocationChange({
                name: value,
                coordinates: null,
                address: {
                    street: '',
                    city: value,
                    state: '',
                    country: '',
                    zipCode: ''
                }
            });
        }
    };

    // Toggle between current location and manual input
    const handleLocationToggle = (useCurrent) => {
        setUseCurrentLocation(useCurrent);
        
        if (useCurrent && currentLocation) {
            onLocationChange(currentLocation);
        } else if (!useCurrent && manualLocation) {
            onLocationChange({
                name: manualLocation,
                coordinates: null,
                address: {
                    street: '',
                    city: manualLocation,
                    state: '',
                    country: '',
                    zipCode: ''
                }
            });
        } else if (!useCurrent) {
            onLocationChange(null);
        }
    };

    // Clear all location data
    const clearLocation = () => {
        setCurrentLocation(null);
        setManualLocation('');
        setUseCurrentLocation(false);
        setLocationError('');
        onLocationChange(null);
    };

    return (
        <div className="location-picker">
            <div className="location-picker-header">
                <span className="location-icon"></span>
                <span>Add Location</span>
            </div>

            {/* Location Toggle Buttons */}
            <div className="location-toggle-buttons">
                <button
                    type="button"
                    className={`location-toggle-btn ${!useCurrentLocation ? 'active' : ''}`}
                    onClick={() => handleLocationToggle(false)}
                >
                    Manual Entry
                </button>
                <button
                    type="button"
                    className={`location-toggle-btn ${useCurrentLocation ? 'active' : ''}`}
                    onClick={() => handleLocationToggle(true)}
                    disabled={locationPermission === 'denied'}
                >
                    Current Location
                </button>
            </div>

            {/* Manual Location Input */}
            {!useCurrentLocation && (
                <div className="manual-location-section">
                    <input
                        type="text"
                        value={manualLocation}
                        onChange={handleManualLocationChange}
                        placeholder="Enter location (e.g., New York, NY)"
                        className="location-input"
                    />
                    <small className="location-help-text">
                        Enter a city, address, or landmark
                    </small>
                </div>
            )}

            {/* Current Location Section */}
            {useCurrentLocation && (
                <div className="current-location-section">
                    {locationPermission === 'denied' && (
                        <div className="location-error">
                            <p>Location access is blocked</p>
                            <small>Please enable location permissions in your browser settings to use this feature.</small>
                        </div>
                    )}

                    {locationPermission !== 'denied' && !currentLocation && !isLoadingLocation && (
                        <div className="location-prompt">
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="get-location-btn"
                            >
                                Get My Current Location
                            </button>
                            <small className="location-help-text">
                                Click to detect your current location using GPS
                            </small>
                        </div>
                    )}

                    {isLoadingLocation && (
                        <div className="location-loading">
                            <div className="loading-spinner"></div>
                            <p>Getting your location...</p>
                            <small>This may take a few seconds</small>
                        </div>
                    )}

                    {currentLocation && (
                        <div className="current-location-display">
                            <div className="location-info">
                                <strong>Current Location:</strong>
                                <p className="location-name">{currentLocation.name}</p>
                                {currentLocation.address.city && (
                                    <p className="location-details">
                                        {currentLocation.address.city}
                                        {currentLocation.address.state && `, ${currentLocation.address.state}`}
                                        {currentLocation.address.country && `, ${currentLocation.address.country}`}
                                    </p>
                                )}
                                {currentLocation.coordinates && (
                                    <p className="location-coordinates">
                                        {currentLocation.coordinates.latitude.toFixed(6)}, {currentLocation.coordinates.longitude.toFixed(6)}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="refresh-location-btn"
                                disabled={isLoadingLocation}
                            >
                                Refresh
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Error Display */}
            {locationError && (
                <div className="location-error">
                    <p>{locationError}</p>
                    {locationError.includes('denied') && (
                        <small>
                            To use location features, please enable location permissions in your browser.
                        </small>
                    )}
                </div>
            )}

            {/* Clear Location Button */}
            {(currentLocation || manualLocation) && (
                <button
                    type="button"
                    onClick={clearLocation}
                    className="clear-location-btn"
                >
                    Clear Location
                </button>
            )}

            {/* Location Privacy Notice */}
            <div className="location-privacy-notice">
                <small>
                    Your location data is only used for this post and is not stored permanently.
                </small>
            </div>
        </div>
    );
};

export default LocationPicker;
