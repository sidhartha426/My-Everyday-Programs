import os from 'node:os';

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip loopback addresses (127.0.0.1) and IPv6 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null; // Return null if no suitable interface is found
}

export { getLocalIpAddress };
