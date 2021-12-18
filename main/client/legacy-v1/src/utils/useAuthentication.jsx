export default function useAuthentication() {
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenData = localStorage.getItem('token');
    if (tokenData != null) {
        if (JSON.parse(tokenData).expires < currentTime) {
            localStorage.removeItem('token');
            return false;
        }
    }
    return JSON.parse(tokenData);
}