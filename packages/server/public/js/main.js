document.addEventListener('DOMContentLoaded', () => {
    console.log('Open Charity scripts initialized.');
    
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});