// Frontend JavaScript - not a worker
console.log('Frontend app loaded');

document.addEventListener('DOMContentLoaded', () => {
    const testButtons = document.querySelectorAll('[data-api-test]');
    testButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const endpoint = e.target.dataset.apiTest;
            try {
                const response = await fetch(endpoint);
                const data = await response.text();
                console.log(`Response from ${endpoint}:`, data);
            } catch (error) {
                console.error('API call failed:', error);
            }
        });
    });
});