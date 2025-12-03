/**
 * Utility functions for Geolocation and Reverse Geocoding
 */

// Get current GPS coordinates
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Trình duyệt không hỗ trợ định vị GPS'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                let errorMessage = 'Lỗi khi lấy vị trí';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Người dùng từ chối cấp quyền vị trí';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Không thể xác định vị trí';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Hết thời gian chờ lấy vị trí';
                        break;
                    default:
                        errorMessage = 'Lỗi không xác định khi lấy vị trí';
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

// Get address from coordinates using OpenStreetMap Nominatim
export const getAddressFromCoordinates = async (lat, lon) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'LotoWeb/1.0' // Required by Nominatim usage policy
                }
            }
        );

        if (!response.ok) {
            throw new Error('Không thể lấy địa chỉ từ tọa độ');
        }

        const data = await response.json();
        return data.display_name;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw error;
    }
};

// Combined function to get current address
export const getCurrentAddress = async () => {
    const { lat, lon } = await getCurrentLocation();
    const address = await getAddressFromCoordinates(lat, lon);
    return address;
};
// Check current permission state without prompting
export const getGeolocationPermission = async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
        return 'prompt'; // Fallback for browsers not supporting Permissions API
    }
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state; // 'granted', 'prompt', 'denied'
    } catch (error) {
        console.error('Error checking permission:', error);
        return 'prompt';
    }
};
