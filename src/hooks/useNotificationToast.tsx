import { useState } from 'react';

interface ToastData {
    title: string;
    body: string;
}

export const useNotificationToast = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [toastData, setToastData] = useState<ToastData>({ title: '', body: '' });

    const showToast = (title: string, body: string) => {
        setToastData({ title, body });
        setIsVisible(true);
    };

    const hideToast = () => {
        setIsVisible(false);
    };

    return {
        isVisible,
        toastData,
        showToast,
        hideToast,
    };
};